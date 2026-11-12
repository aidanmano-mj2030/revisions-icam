// Sessions des comptes à rôle, de bout en bout : retour Google simulé, base D1 imitée par
// node:sqlite (en mémoire) avec les vraies migrations.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import worker from "../src/index.js";

const JOUR = 24 * 3600 * 1000;
const CLIENT_ID = "client-test";

// Imitation minimale de D1 : prepare/bind/first/run/all et batch (transaction).
function baseD1() {
  const db = new DatabaseSync(":memory:");
  const dossier = new URL("../migrations/", import.meta.url);
  for (const f of readdirSync(dossier).filter((n) => n.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(f, dossier), "utf8"));
  }
  const requete = (sql, args = []) => ({
    bind: (...a) => requete(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    executer: () => db.prepare(sql).run(...args),
  });
  return {
    db,
    prepare: (sql) => requete(sql),
    batch: async (requetes) => {
      db.exec("BEGIN");
      try { for (const r of requetes) r.executer(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
      return [];
    },
  };
}

// Connexion complète : /api/google/retour avec un jeton d'identité ICAM, renvoie le cookie de session.
async function connexion(env, email) {
  const nonce = "n".repeat(64);
  const payload = { iss: "https://accounts.google.com", aud: CLIENT_ID, exp: Date.now() / 1000 + 300,
    nonce, email_verified: true, hd: "icam.fr", email };
  const idToken = "x." + Buffer.from(JSON.stringify(payload)).toString("base64url") + ".x";
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ id_token: idToken }), { status: 200 });
  try {
    const etat = "e".repeat(64);
    const reponse = await worker.fetch(new Request(`https://studicam.test/api/google/retour?code=c&state=${etat}`, {
      headers: { Cookie: `studicam_google=${etat}.${nonce}.${"v".repeat(64)}` },
    }), env);
    assert.equal(reponse.status, 302);
    assert.equal(reponse.headers.get("Location"), "/");
    const cookie = reponse.headers.getSetCookie().find((c) => c.startsWith("studicam_session=") && !c.startsWith("studicam_session=;"));
    assert.ok(cookie, "cookie de session posé");
    return cookie.split(";")[0];
  } finally {
    globalThis.fetch = fetchOriginal;
  }
}

const moi = (env, cookie) => worker.fetch(new Request("https://studicam.test/api/moi", { headers: { Cookie: cookie } }), env);

test("compte à rôle avec 5 anciennes sessions de 180 jours : la nouvelle connexion tient", async () => {
  const DB = baseD1();
  const env = { DB, GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: "secret" };
  const email = "prof.test@icam.fr";

  // Élève connecté sur 5 appareils (sessions de 180 jours), puis rôle ajouté.
  for (let i = 0; i < 5; i++) await connexion(env, email);
  DB.db.prepare("INSERT INTO roles (email, role, perimetre) VALUES (?, 'prof', 'a2/ce')").run(email);

  const cookie = await connexion(env, email);
  assert.match(cookie, /^studicam_session=[0-9a-f]{64}$/);
  const reponse = await moi(env, cookie);
  assert.equal(reponse.status, 200, "la nouvelle session n'est pas élaguée");
  assert.equal((await reponse.json()).role, "prof");

  // Le jeton neuf est parmi les 5 gardés (à égalité d'expiration, le plus récent gagne).
  const sessions = DB.db.prepare("SELECT jeton_hash, expire_le FROM sessions").all();
  assert.equal(sessions.length, 5);
  const hashNeuf = createHash("sha256").update(cookie.split("=")[1]).digest("hex");
  assert.ok(sessions.some((s) => s.jeton_hash === hashNeuf), "jeton neuf gardé");
  // Toutes les sessions restantes expirent dans 30 jours au plus.
  const limite = new Date(Date.now() + 30 * JOUR + 60_000).toISOString();
  for (const s of sessions) assert.ok(s.expire_le <= limite, s.expire_le);
});

test("élève : sessions de 180 jours inchangées", async () => {
  const DB = baseD1();
  const env = { DB, GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: "secret" };
  const cookie = await connexion(env, "eleve.test@2030.icam.fr");
  assert.equal((await (await moi(env, cookie)).json()).role, null);
  const { expire_le } = DB.db.prepare("SELECT expire_le FROM sessions").get();
  assert.ok(expire_le > new Date(Date.now() + 179 * JOUR).toISOString(), expire_le);
});
