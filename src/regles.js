// Règles de validation pures, testées par node --test (connexion, progression, accès prof).

// Partie locale prudente, puis icam.fr ou un sous-domaine de icam.fr.
const MOTIF_EMAIL = /^[a-z0-9._%+'-]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*icam\.fr$/;
const MOTIF_CLE = /^[a-z0-9/_.-]{1,120}$/;

// Renvoie l'adresse normalisée, ou null si elle est refusée.
export function normaliserEmail(valeur) {
  if (typeof valeur !== "string") return null;
  const email = valeur.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  return MOTIF_EMAIL.test(email) ? email : null;
}

export function cleValide(cle) {
  return typeof cle === "string" && MOTIF_CLE.test(cle);
}

// Renvoie {cle, reussi, score} ou null si le corps est invalide.
export function validerProgression(corps) {
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) return null;
  const { cle, reussi, score } = corps;
  if (!cleValide(cle) || typeof reussi !== "boolean") return null;
  if (score === undefined || score === null) return { cle, reussi, score: null };
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) return null;
  return { cle, reussi, score };
}

// Lit la partie centrale d'un jeton JWT, sans vérifier la signature : le jeton d'identité
// est reçu directement de Google par HTTPS (OpenID Connect, § 3.1.3.7). Null si illisible.
export function lirePayloadJwt(jeton) {
  if (typeof jeton !== "string") return null;
  const parties = jeton.split(".");
  if (parties.length !== 3 || !/^[A-Za-z0-9_-]+$/.test(parties[1])) return null;
  try {
    const base64 = parties[1].replace(/-/g, "+").replace(/_/g, "/");
    const octets = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(octets));
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

// Renvoie l'adresse ICAM si le jeton Google est valide pour Studicam, sinon null.
// hd n'existe que pour un compte géré par Google Workspace : un compte Google personnel
// créé avec une adresse icam.fr est refusé.
export function emailDepuisGoogle(infos, { clientId, nonce, maintenant }) {
  if (!infos || typeof infos !== "object") return null;
  if (infos.iss !== "https://accounts.google.com" && infos.iss !== "accounts.google.com") return null;
  if (typeof clientId !== "string" || clientId === "" || infos.aud !== clientId) return null;
  if (typeof infos.exp !== "number" || infos.exp * 1000 <= maintenant) return null;
  if (typeof nonce !== "string" || nonce === "" || infos.nonce !== nonce) return null;
  if (infos.email_verified !== true) return null;
  if (typeof infos.hd !== "string" || !(infos.hd === "icam.fr" || infos.hd.endsWith(".icam.fr"))) return null;
  return normaliserEmail(infos.email);
}

// ---------- Accès prof ----------
// Années et matières des clés de progression (ids de MATIERES du site, en minuscules).
export const ANNEES = ["a1", "a2"];
export const MATIERES = ["cm", "ce", "aii", "oi", "est", "maths", "phys", "eco"];
export const ROLES = ["prof", "equipe"];

// Chapitres de l'onglet Révision DS (public/revision-ds.js), rangés par matière.
// Les clés sont <annee>/ds/<ds>/<chapitre> et <annee>/ds/<ds>/examen-<filtre>.
const DS_CHAPITRES = {
  "ds-2026-11": {
    annee: "a2",
    ce: ["mas", "plaque", "bilan", "charge", "normes", "magneto", "mcc"],
    oi: [
      // exposés de veille technologique
      "maintenance", "cnd", "jobshop", "equilibrage", "sst", "metrologie", "smed", "vsm",
      // cours et TD
      "msp", "henry", "cartes", "capa", "mrp", "kanban", "phase", "annales",
    ],
  },
};
// Filtres de l'examen blanc : « tout » mélange CE et OI, il n'a pas de matière.
const DS_FILTRES = { ce: "ce", expo: "oi", cours: "oi" };

// Clés exactes de la Révision DS rangées dans annee/matiere : chapitres et examen blanc filtré
// (même tri que matiereDeCle). [] pour une paire inconnue.
export function clesDsDeMatiere(annee, matiere) {
  if (!paireValide(annee, matiere)) return [];
  const cles = [];
  for (const [ds, def] of Object.entries(DS_CHAPITRES)) {
    if (def.annee !== annee) continue;
    for (const chapitre of Array.isArray(def[matiere]) ? def[matiere] : []) cles.push(`${annee}/ds/${ds}/${chapitre}`);
    for (const [filtre, m] of Object.entries(DS_FILTRES)) {
      if (m === matiere) cles.push(`${annee}/ds/${ds}/examen-${filtre}`);
    }
  }
  return cles;
}

function paireValide(annee, matiere) {
  return ANNEES.includes(annee) && MATIERES.includes(matiere);
}

// "a2/ce, A2/OI,x" → ["a2/ce", "a2/oi"] : paires valides, sans doublon, le reste ignoré.
export function lirePerimetre(texte) {
  if (typeof texte !== "string") return [];
  const paires = [];
  for (const morceau of texte.split(",")) {
    const paire = morceau.trim().toLowerCase();
    const [annee, matiere, ...reste] = paire.split("/");
    if (reste.length === 0 && paireValide(annee, matiere) && !paires.includes(paire)) paires.push(paire);
  }
  return paires;
}

// true si ce rôle peut agir sur annee/matiere. equipe voit tout ; une paire inconnue est
// toujours refusée, même pour equipe. perimetre : tableau de lirePerimetre (ou texte brut).
export function dansPerimetre(role, perimetre, annee, matiere) {
  if (!paireValide(annee, matiere)) return false;
  if (role === "equipe") return true;
  if (role !== "prof") return false;
  const paires = Array.isArray(perimetre) ? perimetre : lirePerimetre(perimetre);
  return paires.includes(annee + "/" + matiere);
}

// {annee, matiere} d'une clé de progression, ou null si elle n'a pas de matière unique
// (clé inconnue, a1/a2 absent, examen blanc « tout » de la Révision DS).
export function matiereDeCle(cle) {
  if (!cleValide(cle)) return null;
  const [annee, deuxieme, troisieme, quatrieme, ...reste] = cle.split("/");
  if (!ANNEES.includes(annee) || troisieme === undefined) return null;
  if (deuxieme !== "ds") return MATIERES.includes(deuxieme) ? { annee, matiere: deuxieme } : null;

  // a2/ds/<ds>/<chapitre> ou a2/ds/<ds>/examen-<filtre>
  const ds = Object.hasOwn(DS_CHAPITRES, troisieme) ? DS_CHAPITRES[troisieme] : null;
  if (!ds || ds.annee !== annee || quatrieme === undefined || reste.length > 0) return null;
  if (quatrieme.startsWith("examen-")) {
    const filtre = quatrieme.slice("examen-".length);
    return Object.hasOwn(DS_FILTRES, filtre) ? { annee, matiere: DS_FILTRES[filtre] } : null;
  }
  for (const matiere of MATIERES) {
    if (ds[matiere] && ds[matiere].includes(quatrieme)) return { annee, matiere };
  }
  return null;
}
