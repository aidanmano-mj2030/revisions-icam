// Vue prof « Questions les plus ratées » : règles pures d'agrégation, testées par node --test
// (test/questions.test.js). Mêmes principes que le tableau de bord (src/regles-stats.js,
// décision du 12/11) :
//   - jamais nominatif : le SQL regroupe déjà par promo et par question (GROUP BY), aucune
//     ligne par élève ne sort ;
//   - une question répondue par moins de SEUIL_ELEVES élèves distincts de la promo est absente
//     de la réponse (0 et 1 à 4 ne se distinguent pas) ;
//   - le taux d'échec n'est donné que par tranche de 20 % (trancheReussite appliquée aux
//     échecs), jamais le nombre d'élèves qui l'ont ratée ;
//   - aucun total entre promos.
// Taux d'échec = part des élèves qui ont raté la question à leur première réponse
// (premier_juste = 0) : refaire ses erreurs ne fausse pas le chiffre.
import { SEUIL_ELEVES, LARGEUR_TRANCHE, masquer, promoDeDomaine, trancheReussite } from "./regles-stats.js";
import { questionValide } from "./regles-series.js";

export const QUESTIONS_PAR_PROMO = 50;   // les plus ratées seulement

// lignes : [{domaine, question, repondu, rates}] déjà agrégées en SQL, une par domaine et question.
// rates sert seulement au calcul de la tranche et au classement ; il ne sort jamais.
export function assemblerQuestions({ annee, matiere, lignes, maintenant }) {
  const parPromo = new Map();
  for (const l of lignes || []) {
    const promo = promoDeDomaine(l.domaine);
    if (!promo || !questionValide(l.question)) continue;
    const repondu = Number(l.repondu) || 0;
    const rates = Math.min(repondu, Math.max(0, Number(l.rates) || 0));
    const p = parPromo.get(promo) || new Map();
    const avant = p.get(l.question) || { repondu: 0, rates: 0 };
    p.set(l.question, { repondu: avant.repondu + repondu, rates: avant.rates + rates });
    parPromo.set(promo, p);
  }

  const promos = [];
  for (const [promo, questions] of parPromo) {
    const gardees = [];
    for (const [id, q] of questions) {
      const repondu = masquer(q.repondu);
      if (repondu === null) continue;
      gardees.push({ id, repondu, echec: trancheReussite(q.rates, q.repondu), taux: q.rates / q.repondu });
    }
    // Les plus ratées d'abord ; à égalité, la plus répondue, puis l'identifiant (ordre stable).
    gardees.sort((a, b) => b.taux - a.taux || b.repondu - a.repondu || a.id.localeCompare(b.id));
    promos.push({
      promo,
      questions: gardees.slice(0, QUESTIONS_PAR_PROMO).map(({ id, repondu, echec }) => ({ id, repondu, echec })),
    });
  }
  promos.sort((a, b) => a.promo.localeCompare(b.promo, "fr", { numeric: true }));
  return {
    annee,
    matiere,
    seuil: SEUIL_ELEVES,
    largeurTranche: LARGEUR_TRANCHE,
    genereLe: new Date(maintenant).toISOString(),
    promos,
  };
}
