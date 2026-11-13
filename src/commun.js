// Outils communs du serveur, partagés par src/index.js et les modules d'API (src/*.js).
// Contrat stable pour les modules : ErreurHttp, json, lireJson, tropDeRequetes,
// sessionCourante, exigerRole, exigerProf. Une ErreurHttp levée devient une réponse JSON
// {erreur} avec son statut (voir le fetch de src/index.js).
import { lirePerimetre, dansPerimetre } from "./regles.js";

export const COOKIE = "studicam_session";
export const DUREE_SESSION_ROLE = 30 * 24 * 3600; // secondes, pour un compte qui a un rôle (prof, equipe)
const TAILLE_MAX_CORPS = 4096;

export class ErreurHttp extends Error {
  constructor(statut, message) {
    super(message);
    this.statut = statut;
  }
}

export function json(donnees, statut = 200, enTetes = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...enTetes },
  });
}

// true si la limite est dépassée. Sans binding (tests), rien n'est limité.
export async function tropDeRequetes(limiteur, cle) {
  if (!limiteur) return false;
  const { success } = await limiteur.limit({ key: cle });
  return !success;
}

export async function sha256Hex(texte) {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

export function lireCookie(request, nomCherche = COOKIE) {
  const brut = request.headers.get("Cookie") || "";
  for (const morceau of brut.split(";")) {
    const [nom, ...reste] = morceau.trim().split("=");
    if (nom === nomCherche) return reste.join("=");
  }
  return null;
}

// Retourne {id, email, jetonHash, role, perimetre} si la session est valide, sinon null.
// role : 'prof', 'equipe' ou null (élève) ; perimetre : tableau de paires "a2/ce" ([] sans rôle).
// Le rôle est relu à chaque requête : un rôle retiré ne vaut plus dès la requête suivante.
export async function sessionCourante(request, env) {
  const jeton = lireCookie(request);
  if (!jeton || !/^[0-9a-f]{64}$/.test(jeton)) return null;
  const jetonHash = await sha256Hex(jeton);
  const ligne = await env.DB.prepare(
    `SELECT s.expire_le, u.id, u.email, u.vu_le, r.role, r.perimetre FROM sessions s
     JOIN utilisateurs u ON u.id = s.utilisateur_id
     LEFT JOIN roles r ON r.email = u.email
     WHERE s.jeton_hash = ? AND s.methode = 'google'`
  ).bind(jetonHash).first();
  if (!ligne) return null;

  const maintenant = new Date().toISOString();
  if (ligne.expire_le <= maintenant) {
    await env.DB.prepare("DELETE FROM sessions WHERE jeton_hash = ?").bind(jetonHash).run();
    return null;
  }
  const role = ligne.role || null;
  // Rôle ajouté après l'ouverture de la session : on ramène son expiration à 30 jours.
  if (role) {
    const limite = new Date(Date.now() + DUREE_SESSION_ROLE * 1000).toISOString();
    if (ligne.expire_le > limite) {
      await env.DB.prepare("UPDATE sessions SET expire_le = ? WHERE jeton_hash = ?").bind(limite, jetonHash).run();
    }
  }
  // vu_le au plus une fois par jour
  if (!ligne.vu_le || ligne.vu_le.slice(0, 10) !== maintenant.slice(0, 10)) {
    await env.DB.prepare("UPDATE utilisateurs SET vu_le = ? WHERE id = ?").bind(maintenant, ligne.id).run();
  }
  return { id: ligne.id, email: ligne.email, jetonHash, role, perimetre: role === "prof" ? lirePerimetre(ligne.perimetre) : [] };
}

// Accès prof. Tout /api/prof/... passe par exigerRole (garderProf de src/index.js) ;
// une route liée à une matière appelle aussi exigerProf.
// exigerRole : il faut une session (401) et un rôle prof ou equipe (403).
export function exigerRole(session) {
  if (!session) throw new ErreurHttp(401, "Non connecté");
  if (session.role !== "prof" && session.role !== "equipe") throw new ErreurHttp(403, "Accès réservé aux profs");
  return session;
}

// exigerProf : en plus, annee/matiere ("a2", "ce") doivent être dans le périmètre (equipe : tout).
// Une paire absente ou inconnue est refusée (403), même pour equipe.
export function exigerProf(session, annee, matiere) {
  exigerRole(session);
  if (!dansPerimetre(session.role, session.perimetre, annee, matiere)) throw new ErreurHttp(403, "Hors de votre périmètre");
  return session;
}

// Contrôles communs aux POST et PUT, puis lecture du JSON. tailleMax : octets acceptés
// (4 Ko par défaut ; les corrections de cours ont besoin de plus).
export async function lireJson(request, tailleMax = TAILLE_MAX_CORPS) {
  const origine = request.headers.get("Origin");
  if (origine !== null && origine !== new URL(request.url).origin) throw new ErreurHttp(403, "Origine refusée");

  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") throw new ErreurHttp(415, "Content-Type application/json attendu");

  // Sans Content-Length (envoi par morceaux), on ne lit pas le corps.
  const enTete = request.headers.get("Content-Length");
  if (enTete === null || !/^\d+$/.test(enTete)) throw new ErreurHttp(411, "Content-Length attendu");
  if (Number(enTete) > tailleMax) throw new ErreurHttp(413, "Corps trop volumineux");
  const brut = await request.arrayBuffer();
  if (brut.byteLength > tailleMax) throw new ErreurHttp(413, "Corps trop volumineux");

  try {
    return JSON.parse(new TextDecoder().decode(brut));
  } catch {
    throw new ErreurHttp(400, "JSON invalide");
  }
}
