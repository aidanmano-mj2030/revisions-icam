// Ma progression : séries terminées et carnet d'erreurs de l'élève connecté.
//
//   POST /api/series   tout connecté : une série terminée (corps : voir validerSerie de
//                      src/regles-series.js) ; 60 envois par minute (LIMITE_ECRITURE, clé à part)
//   GET  /api/series   tout connecté : ses 200 dernières séries et son carnet d'erreurs
//
// Chaque élève ne lit et n'écrit que ses propres lignes (utilisateur_id = session.id).
// Les profs n'y ont pas accès : ils lisent seulement des chiffres agrégés (src/prof-questions.js).
import { ErreurHttp, json, lireJson, tropDeRequetes, sessionCourante } from "./commun.js";
import {
  validerSerie, limiteConservation, questionsAEnregistrer, SERIES_PAR_ELEVE, TAILLE_CORPS_MAX,
} from "./regles-series.js";

const SERIES_LISTE = 200;   // séries renvoyées à l'élève, les plus récentes d'abord
const CARNET_LISTE = 500;   // questions du carnet renvoyées, les plus récemment ratées d'abord

function exigerSession(session) {
  if (!session) throw new ErreurHttp(401, "Non connecté");
  return session;
}

async function enregistrerSerie(request, env) {
  const corps = await lireJson(request, TAILLE_CORPS_MAX);
  const session = exigerSession(await sessionCourante(request, env));
  const entree = validerSerie(corps);
  if (!entree) return json({ erreur: "Série invalide" }, 400);
  if (await tropDeRequetes(env.LIMITE_ECRITURE, "serie:" + session.id)) return json({ erreur: "Trop de requêtes" }, 429);

  const maintenant = Date.now();
  const iso = new Date(maintenant).toISOString();
  const { serie } = entree;

  // Plafond de lignes : questions déjà suivies parmi celles reçues, et nombre total de lignes.
  const ids = entree.questions.map((q) => q.id);
  const [deja, compte] = await Promise.all([
    ids.length
      ? env.DB.prepare(
        "SELECT question, annee, matiere FROM questions_suivi WHERE utilisateur_id = ? AND question IN (SELECT value FROM json_each(?))"
      ).bind(session.id, JSON.stringify(ids)).all()
      : { results: [] },
    env.DB.prepare("SELECT COUNT(*) AS n FROM questions_suivi WHERE utilisateur_id = ?").bind(session.id).first(),
  ]);
  const questions = questionsAEnregistrer(entree.questions, new Map(deja.results.map((l) => [l.question, l])), compte ? compte.n : 0);

  const limite = limiteConservation(maintenant);
  const requetes = [
    env.DB.prepare(
      `INSERT INTO series (utilisateur_id, cle, annee, matiere, titre, mode, refaire, total, justes, note20, pourcent, duree_s, fait_le)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(session.id, serie.cle, serie.annee, serie.matiere, serie.titre, serie.mode, serie.refaire ? 1 : 0,
      serie.total, serie.justes, serie.note20, serie.pourcent, serie.duree_s, iso),
    // Élagage : plus de deux ans, puis au-delà de SERIES_PAR_ELEVE.
    env.DB.prepare("DELETE FROM series WHERE utilisateur_id = ? AND fait_le < ?").bind(session.id, limite),
    env.DB.prepare(
      `DELETE FROM series WHERE utilisateur_id = ?1 AND id NOT IN
         (SELECT id FROM series WHERE utilisateur_id = ?1 ORDER BY fait_le DESC, id DESC LIMIT ?2)`
    ).bind(session.id, SERIES_PAR_ELEVE),
    env.DB.prepare("DELETE FROM questions_suivi WHERE utilisateur_id = ? AND maj_le < ?").bind(session.id, limite),
  ];
  if (questions.length) {
    // Une seule requête pour toutes les questions. Juste : sort du carnet (a_refaire = 0),
    // compteurs gardés. Faux : entre ou reste dans le carnet. premier_juste n'est fixé qu'à
    // la création de la ligne.
    requetes.push(env.DB.prepare(
      `INSERT INTO questions_suivi
         (utilisateur_id, question, annee, matiere, chapitre, premier_juste, echecs, reussites, a_refaire, dernier_echec, maj_le)
       SELECT ?1, json_extract(value, '$.id'), json_extract(value, '$.annee'), json_extract(value, '$.matiere'),
              json_extract(value, '$.chapitre'), json_extract(value, '$.juste'),
              1 - json_extract(value, '$.juste'), json_extract(value, '$.juste'), 1 - json_extract(value, '$.juste'),
              CASE WHEN json_extract(value, '$.juste') = 1 THEN NULL ELSE ?2 END, ?2
       FROM json_each(?3) WHERE true
       ON CONFLICT(utilisateur_id, question) DO UPDATE SET
         chapitre = excluded.chapitre,
         echecs = echecs + excluded.echecs,
         reussites = reussites + excluded.reussites,
         a_refaire = excluded.a_refaire,
         dernier_echec = COALESCE(excluded.dernier_echec, dernier_echec),
         maj_le = excluded.maj_le`
    ).bind(session.id, iso, JSON.stringify(questions.map((q) => ({ ...q, juste: q.juste ? 1 : 0 })))));
  }
  await env.DB.batch(requetes);
  return json({ ok: true, questions: questions.length, ignorees: entree.questions.length - questions.length }, 201);
}

async function lireSeries(request, env) {
  const session = exigerSession(await sessionCourante(request, env));
  const [series, carnet] = await Promise.all([
    env.DB.prepare(
      `SELECT cle, annee, matiere, titre, mode, refaire, total, justes, note20, pourcent, duree_s, fait_le
       FROM series WHERE utilisateur_id = ? ORDER BY fait_le DESC, id DESC LIMIT ?`
    ).bind(session.id, SERIES_LISTE).all(),
    env.DB.prepare(
      `SELECT question, annee, matiere, chapitre, echecs, dernier_echec FROM questions_suivi
       WHERE utilisateur_id = ? AND a_refaire = 1 ORDER BY dernier_echec DESC LIMIT ?`
    ).bind(session.id, CARNET_LISTE).all(),
  ]);
  return json({
    series: series.results.map((s) => ({ ...s, refaire: s.refaire === 1 })),
    carnet: carnet.results.map((q) => ({
      id: q.question, annee: q.annee, matiere: q.matiere, chapitre: q.chapitre, echecs: q.echecs, dernier_echec: q.dernier_echec,
    })),
  });
}

// Module de MODULES_API (src/index.js) : null si la route n'est pas la sienne.
export async function apiSeries(request, env, chemin) {
  if (chemin !== "/api/series") return null;
  if (request.method === "POST") return enregistrerSerie(request, env);
  if (request.method === "GET") return lireSeries(request, env);
  return json({ erreur: "Méthode non autorisée" }, 405, { Allow: "GET, POST" });
}
