// Règles pures des corrections de cours, testées par node --test.
//
// Une correction remplace le texte d'un bloc d'une leçon (paragraphe, formule, encadré,
// ligne de liste, case de tableau). Le bloc est désigné par la page : « p-1k3x9za »,
// type puis empreinte du texte d'origine (public/prof-corrections.js). Si le texte d'origine
// change dans le code, l'empreinte change et la correction ne s'affiche plus : elle reste
// dans la liste de l'Espace prof, marquée « à revoir ».
//
// Le texte est stocké tel que le prof l'a écrit. La page l'affiche en échappant tout le HTML,
// puis n'accepte que **gras**, *italique*, <sup>, <sub> et les retours à la ligne.
import { ANNEES, MATIERES, dansPerimetre } from "./regles.js";
import { LIEUX_LECONS } from "./lecons.js";

export const TEXTE_MAX = 3000;            // caractères, pour le texte corrigé et l'original
export const CORRECTIONS_PAR_JOUR = 300;  // par prof, sur 24 heures glissantes
export const TYPES_BLOC = ["p", "formule", "note", "li", "td"];
export const STATUTS = ["active", "remplacee", "annulee"];

const MOTIF_LECON = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// type-empreinte, puis -N pour la Nᵉ occurrence d'un même texte dans la leçon (N ≥ 2) :
// deux cases « 0 » d'une table de vérité sont deux blocs distincts.
const MOTIF_BLOC = new RegExp(`^(?:${TYPES_BLOC.join("|")})-[0-9a-z]{1,12}(?:-(?:[2-9]|[1-9][0-9]{1,3}))?$`);

// Contrôles C0/C1 (sauf saut de ligne), séparateurs de ligne Unicode, inversions du sens
// d'écriture : même classe que les signalements et les annonces.
const INVISIBLES = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;

// Commandes TeX refusées : liens et attributs HTML (\href, \class, \style…), chargement
// d'extensions, et définitions de macros, qui resteraient actives pour toutes les formules
// de la page (\def\frac… casserait le reste du cours), options de MathJax, et déplacements
// ou rectangles géants qui pourraient recouvrir le reste de la leçon (\rule, \kern, \llap…).
const MACROS_INTERDITES = /\\(?:href|url|class|cssId|style|html[A-Za-z]*|data|require|unicode|def|gdef|edef|xdef|let|futurelet|newcommand|renewcommand|providecommand|newenvironment|renewenvironment|DeclareMathOperator|mmlToken|Newextarrow|setOptions|rule|Rule|kern|mkern|mskip|hskip|hspace|mspace|Space|llap|rlap|clap|mathllap|mathrlap|mathclap|raise|lower|moveleft|moveright|raisebox)(?![A-Za-z])/;

function estObjet(corps) {
  return corps !== null && typeof corps === "object" && !Array.isArray(corps);
}

export function leconValide(valeur) {
  return typeof valeur === "string" && valeur.length <= 60 && MOTIF_LECON.test(valeur);
}

export function blocValide(valeur) {
  return typeof valeur === "string" && MOTIF_BLOC.test(valeur);
}

// Retours à la ligne unifiés, tabulations en espaces, invisibles retirés, bords nettoyés.
// Null si vide, trop long (en caractères, comme length() de SQLite) ou si une macro est refusée.
export function nettoyerTexte(valeur) {
  if (typeof valeur !== "string") return null;
  const texte = valeur.replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(INVISIBLES, "").trim();
  const longueur = [...texte].length;
  if (longueur < 1 || longueur > TEXTE_MAX) return null;
  return MACROS_INTERDITES.test(texte) ? null : texte;
}

export function contientMacroInterdite(texte) {
  return typeof texte === "string" && MACROS_INTERDITES.test(texte);
}

// L'original vient du code du site : on le garde pour la liste, sans le filtre des macros.
function nettoyerOriginal(valeur) {
  if (typeof valeur !== "string") return null;
  const texte = valeur.replace(/\r\n?/g, "\n").replace(INVISIBLES, "");
  const longueur = [...texte].length;
  return longueur >= 1 && longueur <= TEXTE_MAX ? texte : null;
}

// Paires « annee/matiere » d'une leçon connue, [] sinon.
export function lieuxLecon(lecon) {
  const paires = Object.hasOwn(LIEUX_LECONS, lecon) ? LIEUX_LECONS[lecon] : [];
  return paires.filter((p) => {
    const [annee, matiere] = p.split("/");
    return ANNEES.includes(annee) && MATIERES.includes(matiere);
  });
}

// Première paire de la leçon que le compte peut corriger, ou null.
export function paireAutorisee(role, perimetre, lecon) {
  for (const p of lieuxLecon(lecon)) {
    const [annee, matiere] = p.split("/");
    if (dansPerimetre(role, perimetre, annee, matiere)) return { annee, matiere };
  }
  return null;
}

// Corps de POST /api/prof/corrections : {lecon, bloc, original, texte}.
export function validerCorrection(corps) {
  if (!estObjet(corps)) return null;
  const { lecon, bloc } = corps;
  if (!leconValide(lecon) || !blocValide(bloc)) return null;
  const original = nettoyerOriginal(corps.original);
  const texte = nettoyerTexte(corps.texte);
  if (original === null || texte === null) return null;
  return { lecon, bloc, original, texte };
}

// Corps de DELETE /api/prof/corrections : {id}.
export function validerAnnulation(corps) {
  if (!estObjet(corps)) return null;
  const { id } = corps;
  return Number.isSafeInteger(id) && id >= 1 ? { id } : null;
}

export function debutFenetre(maintenant) {
  return new Date(maintenant - 24 * 3600 * 1000).toISOString();
}
