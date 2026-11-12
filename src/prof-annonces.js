// Annonces des profs (PR 2) : routes branchées dans MODULES_API (src/index.js).
//   GET    /api/annonces?annee=a2&matiere=ce   tout connecté : annonces en cours de la matière,
//                                              filtrées sur la promo de l'élève si l'annonce en vise une,
//                                              auteur = nom affichable (pas l'adresse)
//   GET    /api/prof/annonces                  prof ou équipe : annonces de son périmètre
//   POST   /api/prof/annonces                  créer {annee, matiere, promo?, texte, chapitres?, debut, fin}
//   DELETE /api/prof/annonces                  supprimer {id} : ses annonces (prof), toutes (équipe)
// Validation pure dans regles-annonces.js ; rôle et périmètre relus à chaque requête (sessionCourante).
// /api/prof/... passe d'abord par garderProf (index.js) : session, LIMITE_PROF, rôle. exigerRole est
// rappelé ici pour que le module reste sûr même appelé seul ; exigerProf contrôle le périmètre.
import { json, lireJson, sessionCourante, exigerRole, exigerProf } from "./commun.js";
import { ANNEES, MATIERES, dansPerimetre } from "./regles.js";
import {
  ACTIVES_MAX, ajouterJours, annonceVisible, chapitresDepuisTexte, dateDuJour, lireId,
  nomAffichable, promoDeEmail, validerAnnonce,
} from "./regles-annonces.js";

const LIGNES_ELEVE_MAX = 20;
const LIGNES_PROF_MAX = 300;
const HISTORIQUE_JOURS = 30;    // annonces terminées encore listées côté prof
const CONSERVATION_JOURS = 90;  // annonces terminées depuis plus longtemps : supprimées

function etat(ligne, aujourdhui) {
  if (ligne.debut > aujourdhui) return "a_venir";
  return ligne.fin < aujourdhui ? "terminee" : "en_cours";
}

async function annoncesEleve(request, env) {
  const session = await sessionCourante(request, env);
  if (!session) return json({ erreur: "Non connecté" }, 401);
  const params = new URL(request.url).searchParams;
  const annee = params.get("annee");
  const matiere = params.get("matiere") || "";
  if (!ANNEES.includes(annee) || !MATIERES.includes(matiere)) {
    return json({ erreur: "Paramètres annee et matiere attendus" }, 400);
  }

  const aujourdhui = dateDuJour();
  const promo = promoDeEmail(session.email);
  const { results } = await env.DB.prepare(
    `SELECT id, email_prof, promo, texte, chapitres, debut, fin FROM annonces
     WHERE annee = ?1 AND matiere = ?2 AND debut <= ?3 AND fin >= ?3
       AND (promo IS NULL OR ?4 IS NULL OR promo = ?4)
     ORDER BY debut DESC, id DESC LIMIT ?5`
  ).bind(annee, matiere, aujourdhui, promo, LIGNES_ELEVE_MAX).all();

  const annonces = results.filter((l) => annonceVisible(l, aujourdhui, promo)).map((l) => ({
    // élèves : un nom lisible, jamais l'adresse du prof (visible seulement dans l'Espace prof)
    id: l.id, auteur: nomAffichable(l.email_prof), promo: l.promo, texte: l.texte,
    chapitres: chapitresDepuisTexte(l.chapitres), debut: l.debut, fin: l.fin,
  }));
  return json({ annonces });
}

async function listeProf(request, env) {
  const session = await sessionCourante(request, env);
  exigerRole(session);

  const aujourdhui = dateDuJour();
  const depuis = ajouterJours(aujourdhui, -HISTORIQUE_JOURS);
  // Prof : seulement les paires de son périmètre (annonces des collègues comprises).
  const paires = session.role === "equipe" ? null : (session.perimetre || []).map((p) => p.split("/"));
  if (paires && paires.length === 0) return json({ annonces: [], actives: 0, limite: ACTIVES_MAX });

  const filtre = paires ? " AND (" + paires.map(() => "(annee = ? AND matiere = ?)").join(" OR ") + ")" : "";
  const { results } = await env.DB.prepare(
    `SELECT id, email_prof, annee, matiere, promo, texte, chapitres, debut, fin, cree_le FROM annonces
     WHERE fin >= ?${filtre} ORDER BY fin < ?, debut, id LIMIT ?`
  ).bind(depuis, ...(paires || []).flat(), aujourdhui, LIGNES_PROF_MAX).all();

  const annonces = results
    .filter((l) => dansPerimetre(session.role, session.perimetre, l.annee, l.matiere))
    .map((l) => ({
      id: l.id, auteur: l.email_prof, annee: l.annee, matiere: l.matiere, promo: l.promo, texte: l.texte,
      chapitres: chapitresDepuisTexte(l.chapitres), debut: l.debut, fin: l.fin, cree_le: l.cree_le,
      etat: etat(l, aujourdhui),
      supprimable: session.role === "equipe" || l.email_prof === session.email,
    }));
  const actives = await compterActives(env, session.email, aujourdhui);
  return json({ annonces, actives, limite: ACTIVES_MAX });
}

async function compterActives(env, email, aujourdhui) {
  const ligne = await env.DB.prepare("SELECT COUNT(*) AS n FROM annonces WHERE email_prof = ? AND fin >= ?")
    .bind(email, aujourdhui).first();
  return ligne ? ligne.n : 0;
}

async function creer(request, env) {
  const corps = await lireJson(request);
  const session = await sessionCourante(request, env);
  exigerRole(session);
  // Périmètre d'abord (403, paire inconnue comprise), puis le reste du corps (400).
  const cible = corps && typeof corps === "object" && !Array.isArray(corps) ? corps : {};
  exigerProf(session, cible.annee, cible.matiere);
  const aujourdhui = dateDuJour();
  const { annonce, erreur } = validerAnnonce(corps, aujourdhui);
  if (erreur) return json({ erreur }, 400);

  // Une seule requête : la limite d'annonces actives tient même avec deux envois simultanés.
  const cree = await env.DB.prepare(
    `INSERT INTO annonces (email_prof, annee, matiere, promo, texte, chapitres, debut, fin, cree_le)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
     WHERE (SELECT COUNT(*) FROM annonces WHERE email_prof = ?1 AND fin >= ?10) < ?11
     RETURNING id`
  ).bind(
    session.email, annonce.annee, annonce.matiere, annonce.promo, annonce.texte, annonce.chapitres.join(","),
    annonce.debut, annonce.fin, new Date().toISOString(), aujourdhui, ACTIVES_MAX,
  ).first();
  if (!cree) {
    return json({ erreur: `${ACTIVES_MAX} annonces en cours ou à venir au plus : supprimez-en une d'abord` }, 429);
  }
  await env.DB.prepare("DELETE FROM annonces WHERE fin < ?").bind(ajouterJours(aujourdhui, -CONSERVATION_JOURS)).run();
  return json({ ok: true, id: cree.id }, 201);
}

async function supprimer(request, env) {
  const corps = await lireJson(request);
  const session = await sessionCourante(request, env);
  exigerRole(session);
  const id = lireId(corps && typeof corps === "object" ? corps.id : null);
  if (id === null) return json({ erreur: "Identifiant invalide" }, 400);

  const ligne = await env.DB.prepare("SELECT email_prof, annee, matiere FROM annonces WHERE id = ?").bind(id).first();
  if (!ligne) return json({ erreur: "Annonce introuvable" }, 404);
  exigerProf(session, ligne.annee, ligne.matiere);
  if (session.role !== "equipe" && ligne.email_prof !== session.email) {
    return json({ erreur: "Seul l'auteur de l'annonce ou l'équipe peut la supprimer" }, 403);
  }
  await env.DB.prepare("DELETE FROM annonces WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

export async function apiAnnonces(request, env, chemin) {
  const methode = request.method;
  if (chemin === "/api/annonces" && methode === "GET") return annoncesEleve(request, env);
  if (chemin === "/api/prof/annonces") {
    if (methode === "GET") return listeProf(request, env);
    if (methode === "POST") return creer(request, env);
    if (methode === "DELETE") return supprimer(request, env);
  }
  return null;
}
