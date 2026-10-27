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
