// Routes des annonces de bout en bout, par le fetch du Worker (src/index.js : garderProf,
// MODULES_API), sur une D1 simulée par node:sqlite avec toutes les migrations du dossier
// migrations/. Les sessions sont de vraies lignes sessions/roles.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { apiAnnonces } from "../src/prof-annonces.js";
import worker from "../src/index.js";
import { dateDuJour, ajouterJours, ACTIVES_MAX } from "../src/regles-annonces.js";

const ORIGINE = "https://studicam.pages.dev";
const DOSSIER = new URL("../migrations/", import.meta.url);

// D1 réduite à ce que le Worker utilise : prepare().bind().first/all/run et batch.
function d1(db) {
  const requete = (sql, valeurs = []) => ({
    bind: (...v) => requete(sql, v),
    first: async () => db.prepare(sql).get(...valeurs) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...valeurs) }),
    run: async () => { const r = db.prepare(sql).run(...valeurs); return { meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } }; },
  });
  return {
    prepare: (sql) => requete(sql),
    batch: async (liste) => { const r = []; for (const q of liste) r.push(await q.run()); return r; },
  };
}

let db, env, jetons;
const J = dateDuJour();

function ouvrirSession(email, role, perimetre = "") {
  const id = Number(db.prepare("INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?)").run(email, J, J).lastInsertRowid);
  const jeton = createHash("sha256").update(email).digest("hex");
  const expire = new Date(Date.now() + 86400000).toISOString();
  db.prepare("INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le, methode) VALUES (?, ?, ?, 'google')")
    .run(createHash("sha256").update(jeton).digest("hex"), id, expire);
  if (role) db.prepare("INSERT INTO roles (email, role, perimetre, ajoute_par, ajoute_le) VALUES (?, ?, ?, 'test', ?)").run(email, role, perimetre, J);
  return jeton;
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  for (const f of readdirSync(DOSSIER).filter((n) => n.endsWith(".sql")).sort()) db.exec(readFileSync(new URL(f, DOSSIER), "utf8"));
  env = { DB: d1(db) };
  jetons = {
    eleve: ouvrirSession("eleve@2030.icam.fr"),
    eleve31: ouvrirSession("autre@2031.icam.fr"),
    prof: ouvrirSession("prof.ce@icam.fr", "prof", "a2/ce"),
    collegue: ouvrirSession("collegue.ce@icam.fr", "prof", "a2/ce,a1/ce"),
    profOi: ouvrirSession("prof.oi@icam.fr", "prof", "a2/oi"),
    equipe: ouvrirSession("equipe@icam.fr", "equipe"),
  };
});

async function appeler(qui, methode, chemin, corps, enTetes = {}) {
  const h = { ...enTetes };
  if (qui) h.Cookie = "studicam_session=" + jetons[qui];
  let body;
  if (corps !== undefined) {
    body = JSON.stringify(corps);
    h["Content-Type"] ??= "application/json";
    h["Content-Length"] = String(Buffer.byteLength(body));
  }
  const request = new Request(ORIGINE + chemin, { method: methode, headers: h, body });
  const reponse = await worker.fetch(request, env);
  return { statut: reponse.status, corps: await reponse.json() };
}

const annonce = (plus = {}) => ({
  annee: "a2", matiere: "ce", texte: "DS jeudi : triphasé et MAS.", chapitres: ["ce2-triphase"],
  debut: J, fin: ajouterJours(J, 2), ...plus,
});
const lireEleve = (qui, annee = "a2", matiere = "ce") => appeler(qui, "GET", `/api/annonces?annee=${annee}&matiere=${matiere}`);

test("routes inconnues laissées aux autres modules", async () => {
  const request = new Request(ORIGINE + "/api/progression");
  assert.equal(await apiAnnonces(request, env, "/api/progression"), null);
  assert.equal(await apiAnnonces(new Request(ORIGINE + "/api/annonces", { method: "POST" }), env, "/api/annonces"), null);
});

test("lecture élève : connexion et paramètres exigés", async () => {
  assert.equal((await lireEleve(null)).statut, 401);
  for (const q of ["", "?annee=a2", "?annee=a3&matiere=ce", "?annee=a2&matiere=CE", "?annee=a2&matiere=c%27e"]) {
    assert.equal((await appeler("eleve", "GET", "/api/annonces" + q)).statut, 400, q);
  }
  assert.deepEqual((await lireEleve("eleve")).corps, { annonces: [] });
});

test("création par un prof puis lecture par l'élève", async () => {
  const cree = await appeler("prof", "POST", "/api/prof/annonces", annonce({ texte: "<b>DS</b>\r\njeudi" }));
  assert.equal(cree.statut, 201);
  assert.ok(Number.isInteger(cree.corps.id));
  const { statut, corps } = await lireEleve("eleve");
  assert.equal(statut, 200);
  assert.equal(corps.annonces.length, 1);
  assert.deepEqual(corps.annonces[0], {
    id: cree.corps.id, auteur: "prof.ce@icam.fr", promo: null, texte: "<b>DS</b>\njeudi",
    chapitres: ["ce2-triphase"], debut: J, fin: ajouterJours(J, 2),
  });
  // autre matière, autre année : rien
  assert.equal((await lireEleve("eleve", "a2", "oi")).corps.annonces.length, 0);
  assert.equal((await lireEleve("eleve", "a1", "ce")).corps.annonces.length, 0);
});

test("élève : seulement les annonces en cours et de sa promo", async () => {
  const ins = db.prepare(`INSERT INTO annonces (email_prof, annee, matiere, promo, texte, chapitres, debut, fin, cree_le)
    VALUES ('prof.ce@icam.fr', 'a2', 'ce', ?, ?, '', ?, ?, ?)`);
  ins.run(null, "terminée hier", ajouterJours(J, -5), ajouterJours(J, -1), J);
  ins.run(null, "à venir", ajouterJours(J, 1), ajouterJours(J, 3), J);
  ins.run(null, "finit ce soir", ajouterJours(J, -3), J, J);
  ins.run("2030", "promo 2030", J, J, J);
  ins.run("2031", "promo 2031", J, J, J);
  const textes = async (qui) => (await lireEleve(qui)).corps.annonces.map((a) => a.texte).sort();
  assert.deepEqual(await textes("eleve"), ["finit ce soir", "promo 2030"]);
  assert.deepEqual(await textes("eleve31"), ["finit ce soir", "promo 2031"]);
  // personnel sans promo dans l'adresse : toutes les promos
  assert.deepEqual(await textes("profOi"), ["finit ce soir", "promo 2030", "promo 2031"]);
});

test("routes prof réservées au rôle et au périmètre", async () => {
  assert.equal((await appeler(null, "GET", "/api/prof/annonces")).statut, 401);
  assert.equal((await appeler("eleve", "GET", "/api/prof/annonces")).statut, 403);
  assert.equal((await appeler(null, "POST", "/api/prof/annonces", annonce())).statut, 401);
  assert.equal((await appeler("eleve", "POST", "/api/prof/annonces", annonce())).statut, 403);
  assert.equal((await appeler("profOi", "POST", "/api/prof/annonces", annonce())).statut, 403);
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce({ annee: "a1" }))).statut, 403);
  // paire inconnue : refusée même pour l'équipe
  assert.equal((await appeler("equipe", "POST", "/api/prof/annonces", annonce({ matiere: "latin" }))).statut, 403);
  assert.equal((await appeler("equipe", "POST", "/api/prof/annonces", annonce({ annee: "a1", matiere: "eco" }))).statut, 201);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM annonces").get().n, 1);
});

test("création : corps contrôlé", async () => {
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce({ texte: "" }))).statut, 400);
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce({ fin: ajouterJours(J, -1), debut: ajouterJours(J, -2) }))).statut, 400);
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce(), { Origin: "https://evil.example" })).statut, 403);
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce(), { "Content-Type": "text/plain" })).statut, 415);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM annonces").get().n, 0);
});

test(`au plus ${ACTIVES_MAX} annonces actives par prof`, async () => {
  for (let i = 0; i < ACTIVES_MAX; i++) {
    assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce({ texte: "n° " + i }))).statut, 201);
  }
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce())).statut, 429);
  // un collègue n'est pas concerné
  assert.equal((await appeler("collegue", "POST", "/api/prof/annonces", annonce())).statut, 201);
  // une annonce terminée ne compte plus
  db.prepare("UPDATE annonces SET debut = ?1, fin = ?1 WHERE id = 1").run(ajouterJours(J, -1));
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce())).statut, 201);
});

test("liste prof : périmètre, état, droits de suppression", async () => {
  await appeler("prof", "POST", "/api/prof/annonces", annonce({ texte: "ce du prof" }));
  await appeler("collegue", "POST", "/api/prof/annonces", annonce({ texte: "ce du collègue", debut: ajouterJours(J, 3), fin: ajouterJours(J, 4) }));
  await appeler("collegue", "POST", "/api/prof/annonces", annonce({ annee: "a1", texte: "a1 du collègue" }));
  await appeler("profOi", "POST", "/api/prof/annonces", annonce({ matiere: "oi", texte: "oi" }));
  db.prepare(`INSERT INTO annonces (email_prof, annee, matiere, texte, debut, fin, cree_le)
    VALUES ('prof.ce@icam.fr', 'a2', 'ce', 'vieille', ?1, ?1, ?1)`).run(ajouterJours(J, -60));

  const { statut, corps } = await appeler("prof", "GET", "/api/prof/annonces");
  assert.equal(statut, 200);
  assert.deepEqual(corps.annonces.map((a) => [a.texte, a.etat, a.supprimable]), [
    ["ce du prof", "en_cours", true],
    ["ce du collègue", "a_venir", false],
  ]);
  assert.equal(corps.actives, 1);
  assert.equal(corps.limite, ACTIVES_MAX);

  const equipe = await appeler("equipe", "GET", "/api/prof/annonces");
  assert.equal(equipe.corps.annonces.length, 4);
  assert.ok(equipe.corps.annonces.every((a) => a.supprimable));
  assert.equal(equipe.corps.actives, 0);
});

test("suppression : ses annonces (prof), toutes (équipe)", async () => {
  const { corps: { id } } = await appeler("prof", "POST", "/api/prof/annonces", annonce());
  assert.equal((await appeler("prof", "DELETE", "/api/prof/annonces", { id: "abc" })).statut, 400);
  assert.equal((await appeler("prof", "DELETE", "/api/prof/annonces", { id: 999 })).statut, 404);
  assert.equal((await appeler("eleve", "DELETE", "/api/prof/annonces", { id })).statut, 403);
  assert.equal((await appeler("profOi", "DELETE", "/api/prof/annonces", { id })).statut, 403);    // hors périmètre
  assert.equal((await appeler("collegue", "DELETE", "/api/prof/annonces", { id })).statut, 403);  // pas l'auteur
  assert.equal((await appeler("prof", "DELETE", "/api/prof/annonces", { id }, { "Content-Type": "text/plain" })).statut, 415);
  assert.equal((await appeler("equipe", "DELETE", "/api/prof/annonces", { id })).statut, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM annonces").get().n, 0);

  const { corps: { id: id2 } } = await appeler("prof", "POST", "/api/prof/annonces", annonce());
  assert.equal((await appeler("prof", "DELETE", "/api/prof/annonces", { id: id2 })).statut, 200);
  assert.equal((await lireEleve("eleve")).corps.annonces.length, 0);
});

test("limite de débit des routes prof", async () => {
  const vues = [];
  env.LIMITE_PROF = { limit: async ({ key }) => { vues.push(key); return { success: false }; } };
  assert.equal((await appeler("prof", "GET", "/api/prof/annonces")).statut, 429);
  assert.equal((await appeler("prof", "POST", "/api/prof/annonces", annonce())).statut, 429);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM annonces").get().n, 0);
  assert.ok(vues.length >= 2);
  // la lecture élève n'est pas limitée par LIMITE_PROF
  assert.equal((await lireEleve("eleve")).statut, 200);
});
