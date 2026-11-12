// Relecture des leçons par les profs et signalements d'erreurs par les élèves.
//
//   POST   /api/signalement          tout connecté : {annee, matiere, lecon, cle_exo?, message}
//   GET    /api/relectures           tout connecté : leçon → [{nom, annee, matiere, moi}], sans adresse
//   GET    /api/prof/signalements    prof : son périmètre, sans l'élève ; equipe : tout, avec l'élève
//   PATCH  /api/prof/signalements    {id, statut} ; exigerProf sur l'année et la matière du signalement
//   POST   /api/prof/relecture       {lecon, annee, matiere} ; exigerProf
//   DELETE /api/prof/relecture       {lecon, annee, matiere} ; exigerProf, retire sa propre relecture
//
// Le serveur ne connaît pas la liste des leçons (elle est dans public/index.html) : il vérifie
// le format des identifiants et la paire année/matière. La page n'affiche une relecture que
// si son année et sa matière sont bien celles de la leçon dans CHAPITRES.
import { ErreurHttp, json, lireJson, tropDeRequetes, sessionCourante, exigerProf } from "./commun.js";
import { dansPerimetre } from "./regles.js";
import {
  validerSignalement, validerRelecture, validerTraitement, lireFiltreStatut, nomAffichable,
  debutFenetre, SIGNALEMENTS_PAR_JOUR, STATUTS,
} from "./regles-signalements.js";

const SIGNALEMENTS_LISTE_MAX = 200;   // lignes renvoyées à un prof, les plus récentes d'abord
const RELECTURES_PAR_PROF_MAX = 500;
const RELECTURES_LISTE_MAX = 5000;

function exigerSession(session) {
  if (!session) throw new ErreurHttp(401, "Non connecté");
  return session;
}

function aUnRole(session) {
  return session.role === "prof" || session.role === "equipe";
}

// Session, limite de débit des routes prof, puis rôle prof ou equipe.
async function sessionProf(request, env) {
  const session = exigerSession(await sessionCourante(request, env));
  if (await tropDeRequetes(env.LIMITE_PROF, String(session.id))) throw new ErreurHttp(429, "Trop de requêtes");
  if (!aUnRole(session)) throw new ErreurHttp(403, "Accès réservé aux profs");
  return session;
}

async function creerSignalement(request, env) {
  const corps = await lireJson(request);
  const session = exigerSession(await sessionCourante(request, env));
  const entree = validerSignalement(corps);
  if (!entree) return json({ erreur: "Signalement invalide" }, 400);
  if (await tropDeRequetes(env.LIMITE_ECRITURE, String(session.id))) return json({ erreur: "Trop de requêtes" }, 429);

  // Compte et insertion dans la même requête : pas de 6e signalement par deux envois simultanés.
  const maintenant = Date.now();
  const resultat = await env.DB.prepare(
    `INSERT INTO signalements (utilisateur_id, annee, matiere, lecon, cle_exo, message, statut, cree_le)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, 'ouvert', ?7
     WHERE (SELECT COUNT(*) FROM signalements WHERE utilisateur_id = ?1 AND cree_le > ?8) < ?9`
  ).bind(session.id, entree.annee, entree.matiere, entree.lecon, entree.cle_exo, entree.message,
    new Date(maintenant).toISOString(), debutFenetre(maintenant), SIGNALEMENTS_PAR_JOUR).run();
  if (!resultat.meta || resultat.meta.changes !== 1) {
    return json({ erreur: `${SIGNALEMENTS_PAR_JOUR} signalements par jour au maximum, réessaie demain.` }, 429);
  }
  return json({ ok: true }, 201);
}

async function listerRelectures(request, env) {
  const session = exigerSession(await sessionCourante(request, env));
  const { results } = await env.DB.prepare(
    "SELECT lecon, annee, matiere, email_prof FROM relectures ORDER BY le LIMIT ?"
  ).bind(RELECTURES_LISTE_MAX).all();
  const relectures = {};
  for (const l of results) {
    (relectures[l.lecon] ||= []).push({
      nom: nomAffichable(l.email_prof),
      annee: l.annee,
      matiere: l.matiere,
      moi: l.email_prof === session.email,
    });
  }
  return json({ relectures });
}

async function listerSignalements(request, env) {
  const session = await sessionProf(request, env);
  const statut = lireFiltreStatut(new URL(request.url).searchParams.get("statut"));
  if (statut === undefined) return json({ erreur: "Statut inconnu" }, 400);
  const equipe = session.role === "equipe";
  // Prof : paires de son périmètre seulement ; equipe : tout (paires = null).
  const paires = equipe ? null : JSON.stringify(session.perimetre || []);
  const dansLesPaires = "(?1 IS NULL OR (s.annee || '/' || s.matiere) IN (SELECT value FROM json_each(?1)))";

  const [lignes, comptes] = await env.DB.batch([
    env.DB.prepare(
      `SELECT s.id, s.annee, s.matiere, s.lecon, s.cle_exo, s.message, s.statut, s.cree_le,
              s.traite_par, s.traite_le${equipe ? ", u.email AS email_eleve" : ""}
       FROM signalements s${equipe ? " LEFT JOIN utilisateurs u ON u.id = s.utilisateur_id" : ""}
       WHERE ${dansLesPaires} AND (?2 IS NULL OR s.statut = ?2)
       ORDER BY s.cree_le DESC, s.id DESC LIMIT ?3`
    ).bind(paires, statut, SIGNALEMENTS_LISTE_MAX),
    env.DB.prepare(`SELECT s.statut, COUNT(*) AS n FROM signalements s WHERE ${dansLesPaires} GROUP BY s.statut`)
      .bind(paires),
  ]);

  // Seconde barrière : on ne renvoie rien hors du périmètre, quoi que dise la requête SQL.
  const signalements = lignes.results.filter((l) => dansPerimetre(session.role, session.perimetre, l.annee, l.matiere));
  const compte = Object.fromEntries(STATUTS.map((s) => [s, 0]));
  for (const c of comptes.results) if (STATUTS.includes(c.statut)) compte[c.statut] = c.n;
  return json({ signalements, compte, voit_eleves: equipe });
}

async function traiterSignalement(request, env) {
  const corps = await lireJson(request);
  const session = await sessionProf(request, env);
  const entree = validerTraitement(corps);
  if (!entree) return json({ erreur: "Requête invalide" }, 400);
  const ligne = await env.DB.prepare("SELECT annee, matiere FROM signalements WHERE id = ?").bind(entree.id).first();
  if (!ligne) return json({ erreur: "Signalement introuvable" }, 404);
  exigerProf(session, ligne.annee, ligne.matiere);

  const rouvert = entree.statut === "ouvert";
  const le = rouvert ? null : new Date().toISOString();
  const par = rouvert ? null : session.email;
  await env.DB.prepare("UPDATE signalements SET statut = ?, traite_par = ?, traite_le = ? WHERE id = ?")
    .bind(entree.statut, par, le, entree.id).run();
  return json({ ok: true, id: entree.id, statut: entree.statut, traite_par: par, traite_le: le });
}

async function marquerRelu(request, env) {
  const corps = await lireJson(request);
  const session = await sessionProf(request, env);
  const entree = validerRelecture(corps);
  if (!entree) return json({ erreur: "Requête invalide" }, 400);
  exigerProf(session, entree.annee, entree.matiere);

  const resultat = await env.DB.prepare(
    `INSERT INTO relectures (lecon, annee, matiere, email_prof, le)
     SELECT ?1, ?2, ?3, ?4, ?5
     WHERE (SELECT COUNT(*) FROM relectures WHERE email_prof = ?4) < ?6
        OR EXISTS (SELECT 1 FROM relectures WHERE lecon = ?1 AND email_prof = ?4)
     ON CONFLICT(lecon, email_prof) DO UPDATE SET annee = excluded.annee, matiere = excluded.matiere, le = excluded.le`
  ).bind(entree.lecon, entree.annee, entree.matiere, session.email, new Date().toISOString(), RELECTURES_PAR_PROF_MAX).run();
  if (!resultat.meta || resultat.meta.changes !== 1) return json({ erreur: "Trop de leçons marquées" }, 429);
  return json({ ok: true });
}

async function retirerRelu(request, env) {
  const corps = await lireJson(request);
  const session = await sessionProf(request, env);
  const entree = validerRelecture(corps);
  if (!entree) return json({ erreur: "Requête invalide" }, 400);
  exigerProf(session, entree.annee, entree.matiere);
  await env.DB.prepare("DELETE FROM relectures WHERE lecon = ? AND email_prof = ?").bind(entree.lecon, session.email).run();
  return json({ ok: true });
}

// Entrée de MODULES_API : une Response si la route est à nous, sinon null.
export async function apiSignalements(request, env, chemin) {
  const methode = request.method;
  if (chemin === "/api/signalement" && methode === "POST") return creerSignalement(request, env);
  if (chemin === "/api/relectures" && methode === "GET") return listerRelectures(request, env);
  if (chemin === "/api/prof/signalements" && methode === "GET") return listerSignalements(request, env);
  if (chemin === "/api/prof/signalements" && methode === "PATCH") return traiterSignalement(request, env);
  if (chemin === "/api/prof/relecture" && methode === "POST") return marquerRelu(request, env);
  if (chemin === "/api/prof/relecture" && methode === "DELETE") return retirerRelu(request, env);
  return null;
}
