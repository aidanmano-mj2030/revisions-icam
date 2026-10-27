import { normaliserEmail, validerProgression } from "./regles.js";

const COOKIE = "studicam_session";
const DUREE_SESSION = 180 * 24 * 3600; // secondes
const TAILLE_MAX_CORPS = 4096;
const SESSIONS_MAX = 5;          // par élève, les plus anciennes sont supprimées
const LIGNES_PROGRESSION_MAX = 500;
const PAGES_PUBLIQUES = new Set(["/connexion", "/connexion.html"]);

// true si la limite est dépassée. Sans binding (tests), rien n'est limité.
async function tropDeRequetes(limiteur, cle) {
  if (!limiteur) return false;
  const { success } = await limiteur.limit({ key: cle });
  return !success;
}

class ErreurHttp extends Error {
  constructor(statut, message) {
    super(message);
    this.statut = statut;
  }
}

function json(donnees, statut = 200, enTetes = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...enTetes },
  });
}

function redirection(chemin) {
  return new Response(null, { status: 302, headers: { Location: chemin, "Cache-Control": "no-store" } });
}

async function sha256Hex(texte) {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

function nouveauJeton() {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return [...octets].map((o) => o.toString(16).padStart(2, "0")).join("");
}

function lireCookie(request) {
  const brut = request.headers.get("Cookie") || "";
  for (const morceau of brut.split(";")) {
    const [nom, ...reste] = morceau.trim().split("=");
    if (nom === COOKIE) return reste.join("=");
  }
  return null;
}

function cookieSession(valeur, maxAge) {
  return `${COOKIE}=${valeur}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// Retourne {id, email, jetonHash} si la session est valide, sinon null.
async function sessionCourante(request, env) {
  const jeton = lireCookie(request);
  if (!jeton || !/^[0-9a-f]{64}$/.test(jeton)) return null;
  const jetonHash = await sha256Hex(jeton);
  const ligne = await env.DB.prepare(
    `SELECT s.expire_le, u.id, u.email, u.vu_le FROM sessions s
     JOIN utilisateurs u ON u.id = s.utilisateur_id WHERE s.jeton_hash = ?`
  ).bind(jetonHash).first();
  if (!ligne) return null;

  const maintenant = new Date().toISOString();
  if (ligne.expire_le <= maintenant) {
    await env.DB.prepare("DELETE FROM sessions WHERE jeton_hash = ?").bind(jetonHash).run();
    return null;
  }
  // vu_le au plus une fois par jour
  if (!ligne.vu_le || ligne.vu_le.slice(0, 10) !== maintenant.slice(0, 10)) {
    await env.DB.prepare("UPDATE utilisateurs SET vu_le = ? WHERE id = ?").bind(maintenant, ligne.id).run();
  }
  return { id: ligne.id, email: ligne.email, jetonHash };
}

// Contrôles communs aux POST et PUT, puis lecture du JSON.
async function lireJson(request) {
  const origine = request.headers.get("Origin");
  if (origine !== null && origine !== new URL(request.url).origin) throw new ErreurHttp(403, "Origine refusée");

  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") throw new ErreurHttp(415, "Content-Type application/json attendu");

  // Sans Content-Length (envoi par morceaux), on ne lit pas le corps.
  const enTete = request.headers.get("Content-Length");
  if (enTete === null || !/^\d+$/.test(enTete)) throw new ErreurHttp(411, "Content-Length attendu");
  if (Number(enTete) > TAILLE_MAX_CORPS) throw new ErreurHttp(413, "Corps trop volumineux");
  const brut = await request.arrayBuffer();
  if (brut.byteLength > TAILLE_MAX_CORPS) throw new ErreurHttp(413, "Corps trop volumineux");

  try {
    return JSON.parse(new TextDecoder().decode(brut));
  } catch {
    throw new ErreurHttp(400, "JSON invalide");
  }
}

async function connexion(request, env) {
  const corps = await lireJson(request);
  const email = normaliserEmail(corps && corps.email);
  if (!email) return json({ erreur: "Adresse ICAM invalide" }, 400);

  // Déjà connecté avec la même adresse : on garde la session existante, sans compter d'essai.
  const existante = await sessionCourante(request, env);
  if (existante && existante.email === email) return json({ email });

  // Limite large par IP (toute une promo sort par l'IP de l'école), stricte par adresse.
  const ip = request.headers.get("CF-Connecting-IP") || "inconnue";
  if (await tropDeRequetes(env.LIMITE_CONNEXION, "ip:" + ip) || await tropDeRequetes(env.LIMITE_ADRESSE, "email:" + email)) {
    return json({ erreur: "Trop d'essais, attends une minute." }, 429);
  }

  const maintenant = new Date();
  const iso = maintenant.toISOString();
  const expire = new Date(maintenant.getTime() + DUREE_SESSION * 1000).toISOString();

  await env.DB.prepare("INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")
    .bind(email, iso, iso).run();
  const utilisateur = await env.DB.prepare("SELECT id FROM utilisateurs WHERE email = ?").bind(email).first();

  const jeton = nouveauJeton();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expire_le <= ?").bind(iso),
    env.DB.prepare("INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le) VALUES (?, ?, ?)")
      .bind(await sha256Hex(jeton), utilisateur.id, expire),
    env.DB.prepare("UPDATE utilisateurs SET vu_le = ? WHERE id = ?").bind(iso, utilisateur.id),
    env.DB.prepare(
      `DELETE FROM sessions WHERE utilisateur_id = ?1 AND jeton_hash NOT IN
         (SELECT jeton_hash FROM sessions WHERE utilisateur_id = ?1 ORDER BY expire_le DESC LIMIT ?2)`
    ).bind(utilisateur.id, SESSIONS_MAX),
  ]);
  return json({ email }, 200, { "Set-Cookie": cookieSession(jeton, DUREE_SESSION) });
}

async function api(request, env, chemin) {
  const methode = request.method;

  if (chemin === "/api/connexion" && methode === "POST") return connexion(request, env);

  if (chemin === "/api/deconnexion" && methode === "POST") {
    await lireJsonSiCorps(request);
    const jeton = lireCookie(request);
    if (jeton) await env.DB.prepare("DELETE FROM sessions WHERE jeton_hash = ?").bind(await sha256Hex(jeton)).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookieSession("", 0) });
  }

  if (chemin === "/api/moi" && methode === "GET") {
    const session = await sessionCourante(request, env);
    return session ? json({ email: session.email }) : json({ erreur: "Non connecté" }, 401);
  }

  if (chemin === "/api/progression" && methode === "GET") {
    const session = await sessionCourante(request, env);
    if (!session) return json({ erreur: "Non connecté" }, 401);
    const { results } = await env.DB.prepare(
      "SELECT cle, reussi, score, maj_le FROM progression WHERE utilisateur_id = ? LIMIT ?"
    ).bind(session.id, LIGNES_PROGRESSION_MAX).all();
    const progression = {};
    for (const l of results) progression[l.cle] = { reussi: l.reussi === 1, score: l.score, maj_le: l.maj_le };
    return json({ progression });
  }

  if (chemin === "/api/progression" && methode === "PUT") {
    const corps = await lireJson(request);
    const session = await sessionCourante(request, env);
    if (!session) return json({ erreur: "Non connecté" }, 401);
    const entree = validerProgression(corps);
    if (!entree) return json({ erreur: "Progression invalide" }, 400);
    if (await tropDeRequetes(env.LIMITE_ECRITURE, String(session.id))) return json({ erreur: "Trop de requêtes" }, 429);

    const compte = await env.DB.prepare(
      "SELECT COUNT(*) AS n, SUM(cle = ?) AS existe FROM progression WHERE utilisateur_id = ?"
    ).bind(entree.cle, session.id).first();
    if (!compte.existe && compte.n >= LIGNES_PROGRESSION_MAX) return json({ erreur: "Trop d'exercices enregistrés" }, 429);

    // reussi ne redescend jamais ; on garde le meilleur score.
    await env.DB.prepare(
      `INSERT INTO progression (utilisateur_id, cle, reussi, score, maj_le) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(utilisateur_id, cle) DO UPDATE SET
         reussi = MAX(reussi, excluded.reussi),
         score = CASE WHEN excluded.score IS NULL THEN score WHEN score IS NULL THEN excluded.score
                      ELSE MAX(score, excluded.score) END,
         maj_le = excluded.maj_le`
    ).bind(session.id, entree.cle, entree.reussi ? 1 : 0, entree.score, new Date().toISOString()).run();
    return json({ ok: true });
  }

  return json({ erreur: "Introuvable" }, 404);
}

// La déconnexion accepte un corps vide ; si un corps est envoyé, il passe les mêmes contrôles.
async function lireJsonSiCorps(request) {
  const origine = request.headers.get("Origin");
  if (origine !== null && origine !== new URL(request.url).origin) throw new ErreurHttp(403, "Origine refusée");
  if (request.headers.get("Content-Type") || request.headers.get("Content-Length") > 0) await lireJson(request);
}

function avecEnTetesHtml(reponse) {
  const type = reponse.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) return reponse;
  const copie = new Response(reponse.body, reponse);
  copie.headers.set("X-Content-Type-Options", "nosniff");
  copie.headers.set("Referrer-Policy", "same-origin");
  copie.headers.set("X-Frame-Options", "DENY");
  copie.headers.set("Cache-Control", "no-store");  // pas de page connectée restaurée après déconnexion
  return copie;
}

// Tout exige une session, sauf la liste explicite PAGES_PUBLIQUES.
async function pages(request, env, chemin) {
  if (chemin === "/favicon.ico") return new Response(null, { status: 204 });  // pas d'icône, pas de lecture D1
  const session = await sessionCourante(request, env);
  if (PAGES_PUBLIQUES.has(chemin)) {
    if (session) return redirection("/");
    return avecEnTetesHtml(await env.ASSETS.fetch(request));
  }
  if (!session) return redirection("/connexion");
  return avecEnTetesHtml(await env.ASSETS.fetch(request));
}

export default {
  async fetch(request, env) {
    const chemin = new URL(request.url).pathname;
    const estApi = chemin === "/api" || chemin.startsWith("/api/");
    try {
      return estApi ? await api(request, env, chemin) : await pages(request, env, chemin);
    } catch (erreur) {
      if (erreur instanceof ErreurHttp) return json({ erreur: erreur.message }, erreur.statut);
      console.error(erreur);
      return estApi ? json({ erreur: "Erreur interne" }, 500) : new Response("Erreur interne", { status: 500 });
    }
  },
};
