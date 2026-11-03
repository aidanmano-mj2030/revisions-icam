// Règles de validation pures, testées par node --test.

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
