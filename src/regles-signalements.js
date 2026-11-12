// Règles pures de la relecture et des signalements, testées par node --test.
import { ANNEES, MATIERES } from "./regles.js";

export const STATUTS = ["ouvert", "corrige", "rejete"];
export const MESSAGE_MAX = 1000;              // caractères
export const SIGNALEMENTS_PAR_JOUR = 5;       // par utilisateur, sur 24 heures glissantes

// Identifiants de LECONS et clés de EXOS : « aii-grafcet », « maths-dl-usuels »…
const MOTIF_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_MAX = 60;

function estObjet(corps) {
  return corps !== null && typeof corps === "object" && !Array.isArray(corps);
}

export function identifiantValide(valeur) {
  return typeof valeur === "string" && valeur.length <= ID_MAX && MOTIF_ID.test(valeur);
}

export function paireValide(annee, matiere) {
  return ANNEES.includes(annee) && MATIERES.includes(matiere);
}

// Retours à la ligne unifiés, caractères de contrôle retirés (sauf saut de ligne et
// tabulation), espaces de début et de fin retirés. Null si vide ou trop long.
export function nettoyerMessage(valeur) {
  if (typeof valeur !== "string") return null;
  const texte = valeur
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f  ]/g, "")
    .trim();
  const longueur = [...texte].length;   // en caractères, comme length() de SQLite
  return longueur >= 1 && longueur <= MESSAGE_MAX ? texte : null;
}

// Corps de POST /api/signalement : {annee, matiere, lecon, cle_exo?, message}.
// Renvoie l'entrée nettoyée ou null. cle_exo absent, null ou "" → null.
export function validerSignalement(corps) {
  if (!estObjet(corps)) return null;
  const { annee, matiere, lecon, cle_exo, message } = corps;
  if (!paireValide(annee, matiere) || !identifiantValide(lecon)) return null;
  let cleExo = null;
  if (cle_exo !== undefined && cle_exo !== null && cle_exo !== "") {
    if (!identifiantValide(cle_exo)) return null;
    cleExo = cle_exo;
  }
  const texte = nettoyerMessage(message);
  if (texte === null) return null;
  return { annee, matiere, lecon, cle_exo: cleExo, message: texte };
}

// Corps de POST et DELETE /api/prof/relecture : {lecon, annee, matiere}.
export function validerRelecture(corps) {
  if (!estObjet(corps)) return null;
  const { lecon, annee, matiere } = corps;
  if (!paireValide(annee, matiere) || !identifiantValide(lecon)) return null;
  return { lecon, annee, matiere };
}

// Corps de PATCH /api/prof/signalements : {id, statut}.
export function validerTraitement(corps) {
  if (!estObjet(corps)) return null;
  const { id, statut } = corps;
  if (!Number.isSafeInteger(id) || id < 1 || !STATUTS.includes(statut)) return null;
  return { id, statut };
}

// Filtre ?statut= de GET /api/prof/signalements : un statut, « tous », ou ouvert par défaut.
export function lireFiltreStatut(valeur) {
  if (valeur === null || valeur === undefined || valeur === "") return "ouvert";
  if (valeur === "tous") return null;
  return STATUTS.includes(valeur) ? valeur : undefined;
}

// Nom montré aux élèves à la place de l'adresse : « jean-pierre.dupont2@icam.fr »
// → « Jean-Pierre Dupont ». Sans accents (l'adresse n'en a pas). « Un prof » si illisible.
export function nomAffichable(email) {
  if (typeof email !== "string") return "Un prof";
  const locale = email.split("@")[0].toLowerCase();
  const mots = locale
    .split(/[._]+/)
    .map((m) => m.replace(/[^a-z-]/g, "").replace(/^-+|-+$/g, ""))
    .filter((m) => m.length > 0);
  if (mots.length === 0) return "Un prof";
  const majuscule = (m) => m.split("-").filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join("-");
  return mots.map(majuscule).join(" ").slice(0, 60);
}

// Début de la fenêtre de 24 heures pour la limite de signalements.
export function debutFenetre(maintenant) {
  return new Date(maintenant - 24 * 3600 * 1000).toISOString();
}
