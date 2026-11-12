import { emailDepuisGoogle, lirePayloadJwt, validerProgression } from "./regles.js";
import {
  COOKIE, DUREE_SESSION_ROLE, ErreurHttp, json, lireJson, tropDeRequetes, sha256Hex, lireCookie,
  sessionCourante, exigerRole,
} from "./commun.js";
import { apiProfStats } from "./prof-stats.js";

const COOKIE_GOOGLE = "studicam_google"; // état, nonce et vérificateur PKCE pendant l'aller-retour Google
const DUREE_COOKIE_GOOGLE = 600;         // secondes
const GOOGLE_AUTORISATION = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_JETON = "https://oauth2.googleapis.com/token";
const DUREE_SESSION = 180 * 24 * 3600; // secondes
const SESSIONS_MAX = 5;          // par élève, les plus anciennes sont supprimées
const LIGNES_PROGRESSION_MAX = 500;
const PAGES_PUBLIQUES = new Set(["/connexion", "/connexion.html", "/confidentialite", "/confidentialite.html"]);

function redirection(chemin) {
  return new Response(null, { status: 302, headers: { Location: chemin, "Cache-Control": "no-store" } });
}

function nouveauJeton() {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return [...octets].map((o) => o.toString(16).padStart(2, "0")).join("");
}

function base64Url(octets) {
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookieSession(valeur, maxAge) {
  return `${COOKIE}=${valeur}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// Lax : le retour de Google est une navigation de premier niveau, le cookie est donc envoyé.
function cookieGoogle(valeur, maxAge) {
  return `${COOKIE_GOOGLE}=${valeur}; HttpOnly; Secure; SameSite=Lax; Path=/api/google; Max-Age=${maxAge}`;
}

function retourConnexion(erreur, cookies = []) {
  const enTetes = new Headers({ Location: "/connexion?erreur=" + erreur, "Cache-Control": "no-store" });
  for (const c of cookies) enTetes.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers: enTetes });
}

// Départ vers Google. hd=icam.fr ne sert qu'à proposer les comptes ICAM : le vrai contrôle
// est fait au retour, sur le jeton d'identité.
async function debutGoogle(request, env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return retourConnexion("config");
  // Limite large par IP : toute une promo sort par l'IP de l'école.
  const ip = request.headers.get("CF-Connecting-IP") || "inconnue";
  if (await tropDeRequetes(env.LIMITE_CONNEXION, "ip:" + ip)) return retourConnexion("limite");

  const etat = nouveauJeton();
  const nonce = nouveauJeton();
  const verificateur = nouveauJeton();
  const defi = base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificateur))));
  const adresse = new URL(GOOGLE_AUTORISATION);
  adresse.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: new URL(request.url).origin + "/api/google/retour",
    response_type: "code",
    scope: "openid email",
    state: etat,
    nonce,
    code_challenge: defi,
    code_challenge_method: "S256",
    hd: "icam.fr",
    prompt: "select_account",
  }).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: adresse.toString(),
      "Cache-Control": "no-store",
      "Set-Cookie": cookieGoogle(`${etat}.${nonce}.${verificateur}`, DUREE_COOKIE_GOOGLE),
    },
  });
}

async function retourGoogle(request, env) {
  const effacer = cookieGoogle("", 0);
  const params = new URL(request.url).searchParams;
  const [etat, nonce, verificateur] = (lireCookie(request, COOKIE_GOOGLE) || "").split(".");
  if (params.get("error")) return retourConnexion("annule", [effacer]);
  if (!etat || !nonce || !verificateur || params.get("state") !== etat || !params.get("code")) {
    return retourConnexion("expire", [effacer]);
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return retourConnexion("config", [effacer]);

  const reponse = await fetch(GOOGLE_JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.get("code"),
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: new URL(request.url).origin + "/api/google/retour",
      grant_type: "authorization_code",
      code_verifier: verificateur,
    }),
  });
  if (!reponse.ok) {
    console.error("Google : échange du code refusé", reponse.status);
    return retourConnexion("google", [effacer]);
  }
  const { id_token } = await reponse.json();
  const email = emailDepuisGoogle(lirePayloadJwt(id_token), {
    clientId: env.GOOGLE_CLIENT_ID,
    nonce,
    maintenant: Date.now(),
  });
  if (!email) return retourConnexion("compte", [effacer]);

  const { jeton, duree } = await ouvrirSession(env, email);
  const enTetes = new Headers({ Location: "/", "Cache-Control": "no-store" });
  enTetes.append("Set-Cookie", effacer);
  enTetes.append("Set-Cookie", cookieSession(jeton, duree));
  return new Response(null, { status: 302, headers: enTetes });
}

// Crée l'élève si besoin et renvoie {jeton, duree} d'une nouvelle session :
// 30 jours pour un compte qui a un rôle, 180 jours sinon.
async function ouvrirSession(env, email) {
  const maintenant = new Date();
  const iso = maintenant.toISOString();
  const aUnRole = await env.DB.prepare("SELECT 1 AS oui FROM roles WHERE email = ?").bind(email).first();
  const duree = aUnRole ? DUREE_SESSION_ROLE : DUREE_SESSION;
  const expire = new Date(maintenant.getTime() + duree * 1000).toISOString();

  await env.DB.prepare("INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING")
    .bind(email, iso, iso).run();
  const utilisateur = await env.DB.prepare("SELECT id FROM utilisateurs WHERE email = ?").bind(email).first();

  const jeton = nouveauJeton();
  await env.DB.batch([
    // Nettoie aussi les sessions de l'ancienne connexion par adresse seule (methode vide).
    env.DB.prepare("DELETE FROM sessions WHERE expire_le <= ? OR methode IS NULL").bind(iso),
    env.DB.prepare("INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le, methode) VALUES (?, ?, ?, 'google')")
      .bind(await sha256Hex(jeton), utilisateur.id, expire),
    env.DB.prepare("UPDATE utilisateurs SET vu_le = ? WHERE id = ?").bind(iso, utilisateur.id),
    env.DB.prepare(
      `DELETE FROM sessions WHERE utilisateur_id = ?1 AND jeton_hash NOT IN
         (SELECT jeton_hash FROM sessions WHERE utilisateur_id = ?1 ORDER BY expire_le DESC LIMIT ?2)`
    ).bind(utilisateur.id, SESSIONS_MAX),
  ]);
  return { jeton, duree };
}

// Modules d'API des PR suivantes. Chacun est une fonction async (request, env, chemin) qui
// renvoie une Response pour ses routes, ou null pour laisser la main au suivant. Ils sont
// essayés dans l'ordre, après les routes de ce fichier et avant le 404 final de api().
// Pour en ajouter un : une ligne d'import en tête de fichier et une entrée ici, rien d'autre.
// Tout chemin /api/prof/... est déjà gardé avant les modules (session 401, LIMITE_PROF 429,
// rôle 403, voir garderProf) ; une route liée à une matière appelle en plus
// exigerProf(session, annee, matiere) de src/commun.js, et une route POST ou PUT lireJson.
const MODULES_API = [
  apiProfStats,  // tableau de bord (PR 4)
];

async function api(request, env, chemin) {
  const methode = request.method;

  if (chemin === "/api/google/debut" && methode === "GET") return debutGoogle(request, env);
  if (chemin === "/api/google/retour" && methode === "GET") return retourGoogle(request, env);

  if (chemin === "/api/deconnexion" && methode === "POST") {
    await lireJsonSiCorps(request);
    const jeton = lireCookie(request);
    if (jeton) await env.DB.prepare("DELETE FROM sessions WHERE jeton_hash = ?").bind(await sha256Hex(jeton)).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookieSession("", 0) });
  }

  if (chemin === "/api/moi" && methode === "GET") {
    const session = await sessionCourante(request, env);
    if (!session) return json({ erreur: "Non connecté" }, 401);
    return json({ email: session.email, role: session.role, perimetre: session.perimetre });
  }

  if (chemin.startsWith("/api/prof/")) {
    const session = await garderProf(request, env);
    // Sert de test : rôle et périmètre vus par le serveur.
    if (chemin === "/api/prof/moi" && methode === "GET") {
      return json({ email: session.email, role: session.role, perimetre: session.perimetre });
    }
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

  for (const module of MODULES_API) {
    const reponse = await module(request, env, chemin);
    if (reponse) return reponse;
  }

  return json({ erreur: "Introuvable" }, 404);
}

// Garde de tout /api/prof/... : session (401), limite par utilisateur (429), rôle (403).
async function garderProf(request, env) {
  const session = await sessionCourante(request, env);
  if (!session) throw new ErreurHttp(401, "Non connecté");
  if (await tropDeRequetes(env.LIMITE_PROF, String(session.id))) throw new ErreurHttp(429, "Trop de requêtes");
  return exigerRole(session);
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
    if (session && chemin.startsWith("/connexion")) return redirection("/");
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
