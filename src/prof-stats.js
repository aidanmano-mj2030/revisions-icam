// Tableau de bord de la classe : GET /api/prof/stats?annee=a2&matiere=ce
//
// Chiffres agrégés par promo (domaine de l'adresse) et par clé de progression, jamais
// une ligne par élève : les regroupements se font en SQL (GROUP BY), puis assemblerStats
// remplace par null tout chiffre calculé sur moins de 5 élèves (voir regles-stats.js).

import { json, sessionCourante, exigerProf } from "./commun.js";
import { matiereDeCle } from "./regles.js";
import { assemblerStats, debutActivite } from "./regles-stats.js";

const LIGNES_MAX = 5000;  // (promo, clé) ; une matière compte quelques dizaines de clés

// Élèves seulement : adresse en <année sur 4 chiffres>.icam.fr. Les profs (@icam.fr) et le
// personnel d'un site (@toulouse.icam.fr) ne sont jamais comptés ; promoDeDomaine revérifie.
const DOMAINE = "substr(u.email, instr(u.email, '@') + 1)";
const ELEVE = "u.email GLOB '?*@[0-9][0-9][0-9][0-9].icam.fr'";

// Chiffres de la classe pour annee/matiere, sans contrôle d'accès (fait par la route).
// db : binding D1 (ou équivalent dans les tests).
export async function statsClasse(db, { annee, matiere, maintenant = Date.now() }) {
  const [effectifs, cles] = await Promise.all([
    db.prepare(
      `SELECT ${DOMAINE} AS domaine, COUNT(*) AS inscrits, SUM(u.vu_le >= ?1) AS actifs
       FROM utilisateurs u WHERE ${ELEVE} GROUP BY domaine`
    ).bind(debutActivite(maintenant)).all(),
    // La Révision DS (a2/ds/...) mélange CE et OI : matiereDeCle trie ces clés ensuite.
    db.prepare(
      `SELECT ${DOMAINE} AS domaine, p.cle, COUNT(*) AS tentes, SUM(p.reussi = 1) AS reussis,
              AVG(p.score) AS score_moyen, COUNT(p.score) AS scores
       FROM progression p JOIN utilisateurs u ON u.id = p.utilisateur_id
       WHERE ${ELEVE} AND (p.cle LIKE ?1 OR p.cle LIKE ?2)
       GROUP BY domaine, p.cle LIMIT ?3`
    ).bind(`${annee}/${matiere}/%`, `${annee}/ds/%`, LIGNES_MAX).all(),
  ]);
  return assemblerStats({
    annee,
    matiere,
    effectifs: effectifs.results,
    cles: cles.results,
    maintenant,
    garderCle: (cle) => {
      const m = matiereDeCle(cle);
      return !!m && m.annee === annee && m.matiere === matiere;
    },
  });
}

async function routeStats(request, env) {
  const params = new URL(request.url).searchParams;
  const annee = (params.get("annee") || "").toLowerCase();
  const matiere = (params.get("matiere") || "").toLowerCase();
  // garderProf (src/index.js) a déjà vérifié session, LIMITE_PROF et rôle ; exigerProf revérifie
  // la session et refuse (403) une paire hors périmètre ou inconnue : rien d'autre n'arrive au SQL.
  exigerProf(await sessionCourante(request, env), annee, matiere);
  return json(await statsClasse(env.DB, { annee, matiere }));
}

// Module de MODULES_API (src/index.js) : null si la route n'est pas la sienne.
export async function apiProfStats(request, env, chemin) {
  if (chemin !== "/api/prof/stats") return null;
  if (request.method !== "GET") return json({ erreur: "Méthode non autorisée" }, 405, { Allow: "GET" });
  return routeStats(request, env);
}
