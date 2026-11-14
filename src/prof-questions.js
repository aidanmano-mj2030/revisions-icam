// Vue prof « Questions les plus ratées » : GET /api/prof/questions?annee=a2&matiere=ce
//
// Par promo (domaine de l'adresse), les questions de QCM de la matière classées par taux
// d'échec à la première réponse, par tranches de 20 %, seulement celles répondues par au moins
// 5 élèves distincts de la promo. Jamais une ligne par élève : le regroupement se fait en SQL,
// puis assemblerQuestions (src/regles-questions.js) masque et arrondit.
import { json, sessionCourante, exigerProf } from "./commun.js";
import { assemblerQuestions } from "./regles-questions.js";

const LIGNES_MAX = 20000;  // (promo, question) ; une matière compte quelques centaines de questions

// Mêmes filtres que le tableau de bord (src/prof-stats.js) : élèves seulement (adresse de promo
// <année>.icam.fr), jamais un compte qui a un rôle.
const DOMAINE = "substr(u.email, instr(u.email, '@') + 1)";
const ELEVE = "u.email GLOB '?*@[0-9][0-9][0-9][0-9].icam.fr'";
const SANS_ROLE = "NOT EXISTS (SELECT 1 FROM roles r WHERE r.email = lower(u.email))";

// Chiffres de annee/matiere, sans contrôle d'accès (fait par la route). db : binding D1.
export async function questionsRatees(db, { annee, matiere, maintenant = Date.now() }) {
  const { results } = await db.prepare(
    `SELECT ${DOMAINE} AS domaine, q.question, COUNT(*) AS repondu, SUM(q.premier_juste = 0) AS rates
     FROM questions_suivi q JOIN utilisateurs u ON u.id = q.utilisateur_id
     WHERE q.annee = ?1 AND q.matiere = ?2 AND ${ELEVE} AND ${SANS_ROLE}
     GROUP BY domaine, q.question LIMIT ?3`
  ).bind(annee, matiere, LIGNES_MAX).all();
  return assemblerQuestions({ annee, matiere, lignes: results, maintenant });
}

async function routeQuestions(request, env) {
  const params = new URL(request.url).searchParams;
  const annee = (params.get("annee") || "").toLowerCase();
  const matiere = (params.get("matiere") || "").toLowerCase();
  // garderProf (src/index.js) a déjà vérifié session, LIMITE_PROF et rôle ; exigerProf refuse
  // (403) une paire hors périmètre ou inconnue : rien d'autre n'arrive au SQL. equipe : tout.
  exigerProf(await sessionCourante(request, env), annee, matiere);
  return json(await questionsRatees(env.DB, { annee, matiere }));
}

// Module de MODULES_API (src/index.js) : null si la route n'est pas la sienne.
export async function apiProfQuestions(request, env, chemin) {
  if (chemin !== "/api/prof/questions") return null;
  if (request.method !== "GET") return json({ erreur: "Méthode non autorisée" }, 405, { Allow: "GET" });
  return routeQuestions(request, env);
}
