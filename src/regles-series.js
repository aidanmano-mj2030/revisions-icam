// Ma progression : règles pures des séries terminées et du carnet d'erreurs, testées par
// node --test (test/series.test.js).
//
// Corps de POST /api/series : le detail de l'événement « studicam:serie-terminee » (contrat
// commun, point B), plus refaire (booléen facultatif) :
//   { cle, annee, matiere, titre, mode, total, justes, note20, pourcent, duree_s,
//     questions: [{ id, chapitre, juste, repondue }], refaire? }
// Tout ce qui vient de l'élève est vérifié ici ; les textes (titre, chapitre) sont nettoyés et
// ne sont affichés qu'à l'élève lui-même, par textContent.
import { ANNEES, MATIERES, cleValide, matiereDeCle } from "./regles.js";

export const MODES = ["entrainement", "ds"];
export const CLE_REFAIRE = "serie/refaire";      // clé des séries « Refaire mes erreurs » (public/serie.js)
export const QUESTIONS_PAR_SERIE_MAX = 300;   // l'examen blanc « tout » en compte un peu plus de 100
export const TEXTE_MAX = 120;                 // caractères, titre et chapitre
export const DUREE_MAX = 24 * 3600;           // secondes ; au-delà, la durée est jugée inconnue
export const SERIES_PAR_ELEVE = 1000;         // les plus anciennes sont supprimées
export const QUESTIONS_PAR_ELEVE = 3000;      // au-delà, les nouvelles questions sont ignorées
export const CONSERVATION_JOURS = 730;        // deux ans
export const TAILLE_CORPS_MAX = 48 * 1024;    // octets acceptés par lireJson

// Identifiant stable d'une question (contrat commun, point A) :
//   rds/<ce|expo|cours>/<id du sujet>#<8 hex>  ou  exo/<clé EXOS>#<8 hex>
const MOTIF_QUESTION = /^(?:rds\/(ce|expo|cours)\/[a-z0-9]+(?:-[a-z0-9]+)*|exo\/[a-z0-9]+(?:-[a-z0-9]+)*)#[0-9a-f]{8}$/;
const PARTIES_RDS = { ce: { annee: "a2", matiere: "ce" }, expo: { annee: "a2", matiere: "oi" }, cours: { annee: "a2", matiere: "oi" } };

// Même classe de caractères invisibles que les signalements et les annonces.
const INVISIBLES = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;

function estObjet(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Texte d'une ligne : invisibles retirés, espaces regroupés. Null si vide ou trop long.
export function nettoyerTexte(valeur, max = TEXTE_MAX) {
  if (typeof valeur !== "string") return null;
  const texte = valeur.replace(INVISIBLES, " ").replace(/\s+/g, " ").trim();
  const longueur = [...texte].length;
  return longueur >= 1 && longueur <= max ? texte : null;
}

export function questionValide(id) {
  return typeof id === "string" && id.length <= 120 && MOTIF_QUESTION.test(id);
}

// {annee, matiere} d'une question : fixée par la partie pour la Révision DS, celle de la
// série pour un QCM de chapitre (exo/...). Null si inconnue (série sans matière unique) : la
// route reprend alors celle de la ligne déjà en base, s'il y en a une.
export function matiereDeQuestion(id, serie) {
  const m = MOTIF_QUESTION.exec(id);
  if (!m) return null;
  if (m[1]) return PARTIES_RDS[m[1]];
  return serie && serie.annee && serie.matiere ? { annee: serie.annee, matiere: serie.matiere } : null;
}

const entier = (v) => typeof v === "number" && Number.isInteger(v);
const nombre = (v) => typeof v === "number" && Number.isFinite(v);

// Matière de la série : une matière connue, sinon celle de la clé, sinon null (série mixte).
// Un autre type qu'une chaîne ou null est refusé (undefined).
function lireMatiere(matiere, cle) {
  if (matiere === undefined || matiere === null || matiere === "") {
    const m = matiereDeCle(cle);
    return m ? m.matiere : null;
  }
  if (typeof matiere !== "string") return undefined;
  const brute = matiere.trim().toLowerCase();
  if (MATIERES.includes(brute)) return brute;
  const m = matiereDeCle(cle);
  return m ? m.matiere : null;
}

// Renvoie {serie, questions} nettoyés, ou null si le corps est refusé.
//   serie     : {cle, annee, matiere|null, titre, mode, refaire, total, justes, note20, pourcent, duree_s|null}
//   questions : [{id, annee, matiere, chapitre, juste}] répondues seulement, sans doublon
//               (une question vue deux fois dans la série : fausse si l'une des réponses l'est) ;
//               annee et matiere null pour un QCM de chapitre d'une série sans matière unique.
export function validerSerie(corps) {
  if (!estObjet(corps)) return null;
  const { cle, annee, titre, mode, total, justes, note20, pourcent, duree_s, questions, refaire } = corps;
  if (!cleValide(cle)) return null;
  let anneeSerie = null;                             // série « Refaire » de plusieurs années : null
  if (annee !== undefined && annee !== null) {
    if (!ANNEES.includes(annee)) return null;
    anneeSerie = annee;
  } else {
    const m = matiereDeCle(cle);
    if (m) anneeSerie = m.annee;
  }
  const matiere = lireMatiere(corps.matiere, cle);
  if (matiere === undefined) return null;
  const titrePropre = nettoyerTexte(titre);
  if (titrePropre === null || !MODES.includes(mode)) return null;
  if (!entier(total) || total < 1 || total > QUESTIONS_PAR_SERIE_MAX) return null;
  if (!entier(justes) || justes < 0 || justes > total) return null;
  if (!nombre(note20) || note20 < 0 || note20 > 20) return null;
  if (!nombre(pourcent) || pourcent < 0 || pourcent > 100) return null;
  if (refaire !== undefined && typeof refaire !== "boolean") return null;
  let duree = null;
  if (duree_s !== undefined && duree_s !== null) {
    if (!nombre(duree_s) || duree_s < 0) return null;
    duree = duree_s <= DUREE_MAX ? Math.round(duree_s) : null;
  }
  if (!Array.isArray(questions) || questions.length > total) return null;

  const serie = {
    cle, annee: anneeSerie, matiere: anneeSerie ? matiere : null, titre: titrePropre, mode,
    refaire: refaire === true || cle === CLE_REFAIRE || cle.startsWith(CLE_REFAIRE + "/"), total, justes,
    note20: Math.round(note20 * 100) / 100, pourcent: Math.round(pourcent), duree_s: duree,
  };
  const parId = new Map();
  for (const q of questions) {
    if (!estObjet(q) || !questionValide(q.id) || typeof q.juste !== "boolean") return null;
    if (q.repondue !== undefined && typeof q.repondue !== "boolean") return null;
    const chapitre = nettoyerTexte(q.chapitre);
    if (chapitre === null) return null;
    if (q.repondue === false) continue;              // pas répondue : ni erreur ni réussite
    const lieu = matiereDeQuestion(q.id, serie) || { annee: null, matiere: null };
    const avant = parId.get(q.id);
    parId.set(q.id, { id: q.id, annee: lieu.annee, matiere: lieu.matiere, chapitre, juste: q.juste && (!avant || avant.juste) });
  }
  return { serie, questions: [...parId.values()] };
}

// Date ISO avant laquelle les lignes d'un élève sont supprimées.
export function limiteConservation(maintenant, jours = CONSERVATION_JOURS) {
  return new Date(maintenant - jours * 24 * 3600 * 1000).toISOString();
}

// Parmi les questions reçues, celles qu'on peut enregistrer : toutes celles déjà suivies (avec
// l'année et la matière de leur ligne si la série ne les donne pas), puis les nouvelles dans la
// limite de QUESTIONS_PAR_ELEVE lignes pour l'élève ; une nouvelle question sans matière est ignorée.
//   deja         : Map identifiant → {annee, matiere} des lignes déjà en base (parmi les reçus)
//   nombreLignes : lignes déjà en base pour cet élève
export function questionsAEnregistrer(questions, deja, nombreLignes, max = QUESTIONS_PAR_ELEVE) {
  let place = Math.max(0, max - nombreLignes);
  const sortie = [];
  for (const q of questions) {
    const ligne = deja.get(q.id);
    if (ligne) {
      sortie.push(q.matiere ? q : { ...q, annee: ligne.annee, matiere: ligne.matiere });
      continue;
    }
    if (!q.matiere || place <= 0) continue;
    place--;
    sortie.push(q);
  }
  return sortie;
}
