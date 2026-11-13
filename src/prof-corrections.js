// Corrections de cours par les profs (dans leur périmètre) et l'équipe (partout).
//
//   GET    /api/corrections?lecon=   tout connecté : corrections actives d'une leçon, nom du prof,
//                                    date au jour (la page les charge à l'ouverture de la leçon)
//   GET    /api/prof/corrections     prof : son périmètre ; equipe : tout ; avec l'original
//   POST   /api/prof/corrections     {lecon, bloc, original, texte} ; remplace la correction
//                                    active du même bloc
//   DELETE /api/prof/corrections     {id} : annule une correction active (retour à l'original)
//
// L'année et la matière d'une leçon viennent de src/lecons.js (CHAPITRES), jamais du client :
// un prof de CE ne peut pas corriger une leçon de maths en la déclarant « a2/ce ».
import { ErreurHttp, json, lireJson, sessionCourante, exigerRole, exigerProf } from "./commun.js";
import { dansPerimetre } from "./regles.js";
import { nomAffichable } from "./regles-signalements.js";
import {
  validerCorrection, validerAnnulation, paireAutorisee, lieuxLecon, debutFenetre, leconValide,
  CORRECTIONS_PAR_JOUR,
} from "./regles-corrections.js";

const TAILLE_CORPS = 32768;           // original et texte : 3000 caractères chacun, échappés en JSON
export const ACTIVES_PAR_LECON = 500; // corrections actives d'une leçon : tout est renvoyé, rien n'est tronqué
const LISTE_PROF_MAX = 300;           // lignes de l'Espace prof, les plus récentes d'abord

async function sessionProf(request, env) {
  return exigerRole(await sessionCourante(request, env));
}

async function listerActives(request, env) {
  const session = await sessionCourante(request, env);
  if (!session) throw new ErreurHttp(401, "Non connecté");
  const lecon = new URL(request.url).searchParams.get("lecon");
  if (!leconValide(lecon)) return json({ erreur: "Leçon attendue" }, 400);
  const { results } = await env.DB.prepare(
    `SELECT id, lecon, bloc, texte, email_prof, cree_le FROM corrections
     WHERE lecon = ? AND statut = 'active' ORDER BY id LIMIT ?`
  ).bind(lecon, ACTIVES_PAR_LECON).all();
  return json({
    corrections: results.map((c) => ({
      id: c.id, lecon: c.lecon, bloc: c.bloc, texte: c.texte,
      nom: nomAffichable(c.email_prof), le: String(c.cree_le).slice(0, 10),
    })),
  });
}

async function listerPourProf(request, env) {
  const session = await sessionProf(request, env);
  const equipe = session.role === "equipe";
  const paires = equipe ? null : JSON.stringify(session.perimetre || []);
  const { results } = await env.DB.prepare(
    `SELECT id, lecon, bloc, annee, matiere, original, texte, email_prof, cree_le, statut, annule_par, annule_le
     FROM corrections
     WHERE (?1 IS NULL OR (annee || '/' || matiere) IN (SELECT value FROM json_each(?1)))
     ORDER BY id DESC LIMIT ?2`
  ).bind(paires, LISTE_PROF_MAX).all();
  // Seconde barrière : rien hors du périmètre, quoi que dise la requête SQL.
  const corrections = results
    .filter((c) => dansPerimetre(session.role, session.perimetre, c.annee, c.matiere))
    .map((c) => ({
      id: c.id, lecon: c.lecon, bloc: c.bloc, annee: c.annee, matiere: c.matiere,
      original: c.original, texte: c.texte, statut: c.statut, cree_le: c.cree_le,
      nom: nomAffichable(c.email_prof), moi: c.email_prof === session.email,
      annule_par: c.annule_par ? nomAffichable(c.annule_par) : null, annule_le: c.annule_le,
      ...(equipe ? { email_prof: c.email_prof } : {}),
    }));
  return json({ corrections });
}

async function enregistrer(request, env) {
  const corps = await lireJson(request, TAILLE_CORPS);
  const session = await sessionProf(request, env);
  const entree = validerCorrection(corps);
  if (!entree) return json({ erreur: "Correction invalide (texte vide, trop long ou commande TeX refusée)" }, 400);
  if (lieuxLecon(entree.lecon).length === 0) return json({ erreur: "Leçon inconnue" }, 400);
  const paire = paireAutorisee(session.role, session.perimetre, entree.lecon);
  if (!paire) throw new ErreurHttp(403, "Hors de votre périmètre");
  exigerProf(session, paire.annee, paire.matiere);

  // Limites vérifiées dans la transaction même (batch D1), par les deux requêtes : des envois
  // simultanés ne les dépassent pas, et un remplacement n'a lieu que si l'insertion suit.
  //   ?1 lecon, ?2 bloc, ?3 email, ?4 début des 24 heures, ?5 limite par jour, ?6 limite par leçon
  const maintenant = Date.now();
  const le = new Date(maintenant).toISOString();
  const permis = `(SELECT COUNT(*) FROM corrections WHERE email_prof = ?3 AND cree_le > ?4) < ?5
     AND ((SELECT COUNT(*) FROM corrections WHERE lecon = ?1 AND statut = 'active') < ?6
          OR EXISTS (SELECT 1 FROM corrections WHERE lecon = ?1 AND bloc = ?2 AND statut = 'active'))`;
  const limites = [entree.lecon, entree.bloc, session.email, debutFenetre(maintenant), CORRECTIONS_PAR_JOUR, ACTIVES_PAR_LECON];
  const [, insertion] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE corrections SET statut = 'remplacee' WHERE lecon = ?1 AND bloc = ?2 AND statut = 'active' AND ${permis}`
    ).bind(...limites),
    env.DB.prepare(
      `INSERT INTO corrections (lecon, bloc, annee, matiere, original, texte, email_prof, cree_le, statut)
       SELECT ?1, ?2, ?7, ?8, ?9, ?10, ?3, ?11, 'active'
       WHERE NOT EXISTS (SELECT 1 FROM corrections WHERE lecon = ?1 AND bloc = ?2 AND statut = 'active') AND ${permis}`
    ).bind(...limites, paire.annee, paire.matiere, entree.original, entree.texte, le),
  ]);
  if (!insertion || !insertion.meta || insertion.meta.changes !== 1) {
    return json({ erreur: `Limite atteinte : ${CORRECTIONS_PAR_JOUR} corrections par jour et ${ACTIVES_PAR_LECON} par leçon au maximum.` }, 429);
  }
  const ligne = await env.DB.prepare(
    "SELECT id FROM corrections WHERE lecon = ? AND bloc = ? AND statut = 'active'"
  ).bind(entree.lecon, entree.bloc).first();
  return json({
    ok: true,
    correction: { id: ligne && ligne.id, lecon: entree.lecon, bloc: entree.bloc, texte: entree.texte, nom: nomAffichable(session.email), le: le.slice(0, 10) },
  }, 201);
}

async function annuler(request, env) {
  const corps = await lireJson(request);
  const session = await sessionProf(request, env);
  const entree = validerAnnulation(corps);
  if (!entree) return json({ erreur: "Requête invalide" }, 400);
  const ligne = await env.DB.prepare("SELECT annee, matiere, statut FROM corrections WHERE id = ?").bind(entree.id).first();
  if (!ligne) return json({ erreur: "Correction introuvable" }, 404);
  exigerProf(session, ligne.annee, ligne.matiere);
  if (ligne.statut !== "active") return json({ erreur: "Cette correction n'est plus affichée" }, 409);
  await env.DB.prepare(
    "UPDATE corrections SET statut = 'annulee', annule_par = ?, annule_le = ? WHERE id = ? AND statut = 'active'"
  ).bind(session.email, new Date().toISOString(), entree.id).run();
  return json({ ok: true, id: entree.id });
}

// Entrée de MODULES_API : une Response si la route est à nous, sinon null.
export async function apiCorrections(request, env, chemin) {
  const methode = request.method;
  if (chemin === "/api/corrections" && methode === "GET") return listerActives(request, env);
  if (chemin === "/api/prof/corrections" && methode === "GET") return listerPourProf(request, env);
  if (chemin === "/api/prof/corrections" && methode === "POST") return enregistrer(request, env);
  if (chemin === "/api/prof/corrections" && methode === "DELETE") return annuler(request, env);
  return null;
}
