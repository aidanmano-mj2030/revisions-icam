// Règles pures des annonces de profs (PR 2), testées par node --test (test/annonces.test.js).
// Le contrôle du rôle et du périmètre est fait à part, par exigerProf (src/commun.js).

export const TEXTE_MAX = 500;           // caractères
export const CHAPITRES_MAX = 30;
export const ACTIVES_MAX = 20;          // annonces non terminées par prof
export const DUREE_MAX_JOURS = 120;     // de debut à fin
export const AVANCE_MAX_JOURS = 365;    // debut au plus tard dans un an

const MOTIF_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MOTIF_MATIERE = /^[a-z]{1,10}$/;
const MOTIF_PROMO = /^\d{4}$/;
const MOTIF_CHAPITRE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const JOUR = 24 * 3600 * 1000;

// Date du jour à Paris, AAAA-MM-JJ : une annonce « jusqu'au 14 » reste visible le 14 au soir.
export function dateDuJour(maintenant = Date.now()) {
  const morceaux = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(maintenant));
  const valeur = (type) => morceaux.find((m) => m.type === type).value;
  return `${valeur("year")}-${valeur("month")}-${valeur("day")}`;
}

// true pour une vraie date du calendrier (pas de 2026-02-30).
export function dateValide(texte) {
  if (typeof texte !== "string" || !MOTIF_DATE.test(texte)) return false;
  const d = new Date(texte + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texte;
}

export function ajouterJours(date, jours) {
  return new Date(Date.parse(date + "T00:00:00Z") + jours * JOUR).toISOString().slice(0, 10);
}

function ecartJours(debut, fin) {
  return Math.round((Date.parse(fin + "T00:00:00Z") - Date.parse(debut + "T00:00:00Z")) / JOUR);
}

// Promo d'une adresse élève : « prenom.nom@2030.icam.fr » → "2030". Null pour une adresse
// sans promo (personnel en @icam.fr) ou de forme inattendue.
export function promoDeEmail(email) {
  if (typeof email !== "string") return null;
  const m = /@([^@.]+)\.icam\.fr$/.exec(email.trim().toLowerCase());
  return m && MOTIF_PROMO.test(m[1]) ? m[1] : null;
}

// Texte simple : retours à la ligne gardés (trois au plus d'affilée deviennent deux),
// tabulations en espaces, autres caractères de contrôle refusés. Null si vide ou trop long.
export function normaliserTexte(valeur) {
  if (typeof valeur !== "string") return null;
  const texte = valeur.replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  // contrôles C0/C1 sauf \n, séparateurs de ligne Unicode et inversions de sens d'écriture
  if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/.test(texte)) return null;
  const longueur = [...texte].length;  // en caractères, comme length() de SQLite
  return longueur >= 1 && longueur <= TEXTE_MAX ? texte : null;
}

// Liste d'identifiants de leçons : sans doublon, dans l'ordre reçu. Null si invalide.
export function lireChapitres(valeur) {
  if (valeur === undefined || valeur === null) return [];
  if (!Array.isArray(valeur) || valeur.length > CHAPITRES_MAX) return null;
  const chapitres = [];
  for (const id of valeur) {
    if (typeof id !== "string" || !MOTIF_CHAPITRE.test(id)) return null;
    if (!chapitres.includes(id)) chapitres.push(id);
  }
  return chapitres;
}

// Colonne chapitres de la base ('a,b') → ['a', 'b'] ; entrées mal formées ignorées.
export function chapitresDepuisTexte(texte) {
  if (typeof texte !== "string" || texte === "") return [];
  return texte.split(",").filter((id) => MOTIF_CHAPITRE.test(id));
}

// Corps de POST /api/prof/annonces → {annonce} ou {erreur} (message montré au prof).
// aujourdhui : dateDuJour(). La matière n'est contrôlée ici que sur sa forme ; exigerProf
// refuse ensuite toute paire année/matière inconnue ou hors périmètre.
export function validerAnnonce(corps, aujourdhui) {
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) return { erreur: "Annonce invalide" };
  const { annee, matiere, promo, texte, chapitres, debut, fin } = corps;

  if (annee !== "a1" && annee !== "a2") return { erreur: "Année invalide" };
  if (typeof matiere !== "string" || !MOTIF_MATIERE.test(matiere)) return { erreur: "Matière invalide" };

  let promoLue = null;
  if (promo !== undefined && promo !== null && promo !== "") {
    if (typeof promo !== "string" || !MOTIF_PROMO.test(promo.trim())) return { erreur: "Promo invalide (4 chiffres, ex. 2030)" };
    promoLue = promo.trim();
  }

  const texteLu = normaliserTexte(texte);
  if (texteLu === null) return { erreur: `Texte vide, trop long (${TEXTE_MAX} caractères au plus) ou avec des caractères interdits` };

  const chapitresLus = lireChapitres(chapitres);
  if (chapitresLus === null) return { erreur: "Chapitres invalides" };

  if (!dateValide(debut) || !dateValide(fin)) return { erreur: "Dates invalides" };
  if (fin < debut) return { erreur: "La fin est avant le début" };
  if (fin < aujourdhui) return { erreur: "La date de fin est déjà passée" };
  if (debut > ajouterJours(aujourdhui, AVANCE_MAX_JOURS)) return { erreur: "Début trop lointain (un an au plus)" };
  if (ecartJours(debut, fin) > DUREE_MAX_JOURS) return { erreur: `Annonce trop longue (${DUREE_MAX_JOURS} jours au plus)` };

  return {
    annonce: { annee, matiere, promo: promoLue, texte: texteLu, chapitres: chapitresLus, debut, fin },
  };
}

// Visible par un élève aujourd'hui : en cours, et pour sa promo si l'annonce en vise une.
// promoLecteur null (personnel en @icam.fr) : toutes les promos.
export function annonceVisible(annonce, aujourdhui, promoLecteur) {
  if (!annonce || annonce.debut > aujourdhui || annonce.fin < aujourdhui) return false;
  return !annonce.promo || promoLecteur === null || annonce.promo === promoLecteur;
}

// "12" ou 12 → 12 ; null pour tout ce qui n'est pas un identifiant entier positif.
export function lireId(valeur) {
  const texte = typeof valeur === "number" ? String(valeur) : valeur;
  if (typeof texte !== "string" || !/^[1-9]\d{0,14}$/.test(texte)) return null;
  return Number(texte);
}
