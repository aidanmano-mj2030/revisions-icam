// Tableau de bord prof : règles pures d'agrégation, testées par node --test.
//
// Le serveur ne renvoie que des chiffres agrégés par promo, jamais une ligne par élève, et
// jamais le nombre exact d'élèves qui ont réussi ou raté un exercice : seulement une tranche
// de 20 % du taux de réussite (trancheReussite). Seuil de SEUIL_ELEVES élèves :
//   - toute promo ayant des élèves inscrits apparaît, même sans aucune tentative (sa présence
//     ne révèle rien) ; sous SEUIL_ELEVES inscrits, elle n'a aucun chiffre ;
//   - exercice tenté par moins de SEUIL_ELEVES élèves : absent de la réponse (0 et 1 à 4
//     ne se distinguent pas) ;
//   - score moyen calculé sur moins de SEUIL_ELEVES scores : null ; sinon arrondi à l'entier ;
//   - élèves actifs sur 7 jours : null s'ils sont moins de SEUIL_ELEVES ;
//   - élèves ayant fait au moins un exercice de la matière : null sous SEUIL_ELEVES ;
//   - aucun total entre promos.

export const SEUIL_ELEVES = 5;
export const JOURS_ACTIFS = 7;

const SUFFIXE_ICAM = ".icam.fr";
const MOTIF_PROMO = /^\d{4}$/;  // comme regles-annonces.js : année de promo, ex. 2027

// Promo d'un domaine d'adresse : "2027.icam.fr" → "2027". Null pour icam.fr (profs,
// personnel), pour un sous-domaine qui n'est pas une année sur 4 chiffres (personnel d'un
// site, ex. toulouse.icam.fr), pour un sous-domaine à plusieurs niveaux ou un autre domaine.
export function promoDeDomaine(domaine) {
  if (typeof domaine !== "string") return null;
  const d = domaine.trim().toLowerCase();
  if (!d.endsWith(SUFFIXE_ICAM)) return null;
  const promo = d.slice(0, -SUFFIXE_ICAM.length);
  return MOTIF_PROMO.test(promo) ? promo : null;
}

// Promo d'une adresse élève "prenom.nom@2027.icam.fr" → "2027", sinon null.
export function promoDeEmail(email) {
  if (typeof email !== "string") return null;
  const i = email.lastIndexOf("@");
  return i > 0 ? promoDeDomaine(email.slice(i + 1)) : null;
}

// n si le groupe compte au moins SEUIL_ELEVES élèves, sinon null.
export function masquer(n) {
  const v = Number(n);
  return Number.isFinite(v) && v >= SEUIL_ELEVES ? v : null;
}

// Date ISO à partir de laquelle un élève compte comme actif.
export function debutActivite(maintenant, jours = JOURS_ACTIFS) {
  return new Date(maintenant - jours * 24 * 3600 * 1000).toISOString();
}

export const LARGEUR_TRANCHE = 20;  // en points de pourcentage

// Tranche du taux de réussite, {min, max} en % : [0, 20[, [20, 40[, [40, 60[, [60, 80[ et
// [80, 100]. 0 % tombe dans 0-20 et 100 % dans 80-100. Calcul en entiers (pas d'arrondi
// flottant à une borne) : 1 sur 5 = 20 % → 20-40 ; 2 sur 30 → 0-20. Null sans tentative.
export function trancheReussite(reussis, tentes) {
  if (!Number.isInteger(reussis) || !Number.isInteger(tentes) || tentes <= 0 || reussis < 0 || reussis > tentes) return null;
  const nombre = 100 / LARGEUR_TRANCHE;  // 5 tranches
  const i = Math.min(nombre - 1, Math.floor((nombre * reussis) / tentes));
  return { min: i * LARGEUR_TRANCHE, max: (i + 1) * LARGEUR_TRANCHE };
}

// Assemble la réponse de GET /api/prof/stats à partir de lignes déjà agrégées en SQL.
//   effectifs : [{domaine, inscrits, actifs}]                       une ligne par domaine
//   cles      : [{domaine, cle, tentes, reussis, score_moyen, scores}] une ligne par domaine et clé
//   eleves    : [{domaine, eleves}]  élèves distincts ayant fait un exercice de la matière
//   garderCle : (cle) => booléen, garde les clés de la matière demandée
// reussis sert seulement à calculer la tranche ; il ne sort jamais.
export function assemblerStats({ annee, matiere, effectifs, cles, eleves, garderCle, maintenant }) {
  const parPromo = new Map();
  for (const e of effectifs || []) {
    const promo = promoDeDomaine(e.domaine);
    if (!promo) continue;
    const p = parPromo.get(promo) || { inscrits: 0, actifs: 0, eleves: 0, cles: [] };
    p.inscrits += Number(e.inscrits) || 0;
    p.actifs += Number(e.actifs) || 0;
    parPromo.set(promo, p);
  }
  for (const e of eleves || []) {
    const promo = promoDeDomaine(e.domaine);
    if (promo && parPromo.has(promo)) parPromo.get(promo).eleves += Number(e.eleves) || 0;
  }
  for (const l of cles || []) {
    const promo = promoDeDomaine(l.domaine);
    if (!promo || !parPromo.has(promo) || !garderCle(l.cle)) continue;
    parPromo.get(promo).cles.push(l);
  }

  const promos = [];
  for (const [promo, p] of parPromo) {
    const inscrits = masquer(p.inscrits);
    const sortie = {
      promo,
      inscrits,
      actifs: inscrits === null ? null : masquer(p.actifs),
      eleves: inscrits === null ? null : masquer(p.eleves),
      cles: {},
    };
    if (inscrits !== null) {
      for (const l of p.cles) {
        const tentes = masquer(l.tentes);
        if (tentes === null) continue;  // absente : la page affiche « moins de 5 », sans distinguer 0
        sortie.cles[l.cle] = {
          tentes,
          reussite: trancheReussite(Number(l.reussis) || 0, Number(l.tentes)),
          scoreMoyen: masquer(l.scores) === null || l.score_moyen == null ? null : Math.round(Number(l.score_moyen)),
        };
      }
    }
    promos.push(sortie);
  }
  promos.sort((a, b) => a.promo.localeCompare(b.promo, "fr", { numeric: true }));
  return {
    annee,
    matiere,
    seuil: SEUIL_ELEVES,
    largeurTranche: LARGEUR_TRANCHE,
    joursActifs: JOURS_ACTIFS,
    genereLe: new Date(maintenant).toISOString(),
    promos,
  };
}
