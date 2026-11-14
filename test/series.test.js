// Ma progression (lot 3) : validation des séries reçues, carnet d'erreurs, limites, et vue prof
// « Questions les plus ratées » (seuil de 5 élèves, tranches de 20 %, périmètre, rien de nominatif).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  validerSerie, questionValide, matiereDeQuestion, nettoyerTexte, questionsAEnregistrer, limiteConservation,
  QUESTIONS_PAR_SERIE_MAX, QUESTIONS_PAR_ELEVE, SERIES_PAR_ELEVE,
} from "../src/regles-series.js";
import { assemblerQuestions, QUESTIONS_PAR_PROMO } from "../src/regles-questions.js";

const MAINTENANT = Date.UTC(2026, 10, 14, 12);
const H = (n) => n.toString(16).padStart(8, "0");

function serie(modifs = {}) {
  return {
    cle: "a2/ds/ds-2026-11/examen-ce", annee: "a2", matiere: "ce", titre: "Examen blanc · CE", mode: "entrainement",
    total: 3, justes: 1, note20: 6.67, pourcent: 33, duree_s: 125,
    questions: [
      { id: "rds/ce/mas#" + H(1), chapitre: "CE · Moteur asynchrone", juste: true, repondue: true },
      { id: "rds/ce/mas#" + H(2), chapitre: "CE · Moteur asynchrone", juste: false, repondue: true },
      { id: "rds/ce/plaque#" + H(3), chapitre: "CE · Plaque signalétique", juste: false, repondue: false },
    ],
    ...modifs,
  };
}

// ---------- validation des données reçues ----------

test("identifiant de question : <source>#<8 hex>", () => {
  for (const id of ["rds/ce/mas#0a1b2c3d", "rds/expo/maintenance#ffffffff", "rds/cours/msp#00000000", "exo/oi2-veille#12345678"]) {
    assert.ok(questionValide(id), id);
  }
  for (const id of [
    "rds/ce/mas#0A1B2C3D", "rds/ce/mas#0a1b2c3", "rds/ce/mas#0a1b2c3d0", "rds/autre/mas#0a1b2c3d", "rds/ce#0a1b2c3d",
    "exo/#0a1b2c3d", "exo/a b#0a1b2c3d", "exo/x/y#0a1b2c3d", "rds/ce/-mas#0a1b2c3d", "a2/ce/x#0a1b2c3d",
    "<script>#0a1b2c3d", "", null, 42, "exo/" + "a".repeat(120) + "#0a1b2c3d",
  ]) {
    assert.ok(!questionValide(id), String(id));
  }
});

test("matière d'une question : partie de la Révision DS, sinon celle de la série", () => {
  assert.deepEqual(matiereDeQuestion("rds/ce/mas#00000001", null), { annee: "a2", matiere: "ce" });
  assert.deepEqual(matiereDeQuestion("rds/expo/smed#00000001", { annee: "a1", matiere: "maths" }), { annee: "a2", matiere: "oi" });
  assert.deepEqual(matiereDeQuestion("rds/cours/msp#00000001", null), { annee: "a2", matiere: "oi" });
  assert.deepEqual(matiereDeQuestion("exo/oi2-veille#00000001", { annee: "a2", matiere: "oi" }), { annee: "a2", matiere: "oi" });
  assert.equal(matiereDeQuestion("exo/oi2-veille#00000001", { annee: "a2", matiere: null }), null);
});

test("série valide : nettoyée, questions non répondues ignorées", () => {
  const r = validerSerie(serie({ titre: "  Examen\u202e blanc\n· CE  " }));
  assert.deepEqual(r.serie, {
    cle: "a2/ds/ds-2026-11/examen-ce", annee: "a2", matiere: "ce", titre: "Examen blanc · CE", mode: "entrainement",
    refaire: false, total: 3, justes: 1, note20: 6.67, pourcent: 33, duree_s: 125,
  });
  assert.deepEqual(r.questions, [
    { id: "rds/ce/mas#00000001", annee: "a2", matiere: "ce", chapitre: "CE · Moteur asynchrone", juste: true },
    { id: "rds/ce/mas#00000002", annee: "a2", matiere: "ce", chapitre: "CE · Moteur asynchrone", juste: false },
  ]);
});

test("série : matière absente ou mixte, durée, refaire, doublons", () => {
  // examen « tout » : pas de matière unique, les questions gardent la leur
  const tout = validerSerie(serie({ cle: "a2/ds/ds-2026-11/examen-tout", matiere: null }));
  assert.equal(tout.serie.matiere, null);
  assert.equal(tout.questions.length, 2);
  // matière inconnue : déduite de la clé si possible
  assert.equal(validerSerie(serie({ matiere: "ds" })).serie.matiere, "ce");
  assert.equal(validerSerie(serie({ matiere: "CE" })).serie.matiere, "ce");
  assert.equal(validerSerie(serie({ cle: "a2/ds/ds-2026-11/examen-tout", matiere: "tout" })).serie.matiere, null);
  // QCM de chapitre sans matière : ses questions exo/... ne peuvent pas être rangées
  const exo = validerSerie(serie({ cle: "a2/oi/oi2-veille/vt", matiere: "oi", questions: [
    { id: "exo/oi2-veille#00000009", chapitre: "OI · Veille", juste: false, repondue: true }] }));
  assert.deepEqual(exo.questions.map((q) => [q.annee, q.matiere]), [["a2", "oi"]]);
  const exoSans = validerSerie(serie({ cle: "zz/x", matiere: null, questions: [
    { id: "exo/oi2-veille#00000009", chapitre: "OI · Veille", juste: false }] }));
  assert.deepEqual(exoSans.questions.map((q) => [q.annee, q.matiere]), [[null, null]]);
  // série « Refaire » de public/serie.js : clé serie/refaire, année et matière absentes si mélangées
  const refaire = validerSerie(serie({ cle: "serie/refaire", annee: null, matiere: null }));
  assert.deepEqual([refaire.serie.annee, refaire.serie.matiere, refaire.serie.refaire], [null, null, true]);
  assert.equal(validerSerie(serie({ cle: "serie/refaire", annee: "a2", matiere: "ce" })).serie.refaire, true);
  assert.equal(validerSerie(serie({ annee: undefined })).serie.annee, "a2");  // déduite de la clé
  // durée : null acceptée, trop longue jugée inconnue
  assert.equal(validerSerie(serie({ duree_s: null })).serie.duree_s, null);
  assert.equal(validerSerie(serie({ duree_s: undefined })).serie.duree_s, null);
  assert.equal(validerSerie(serie({ duree_s: 90000 })).serie.duree_s, null);
  assert.equal(validerSerie(serie({ duree_s: 12.4 })).serie.duree_s, 12);
  assert.equal(validerSerie(serie({ refaire: true })).serie.refaire, true);
  // même question deux fois : fausse si l'une des réponses l'est, comptée une fois
  const double = validerSerie(serie({ questions: [
    { id: "rds/ce/mas#00000001", chapitre: "A", juste: true }, { id: "rds/ce/mas#00000001", chapitre: "A", juste: false }] }));
  assert.deepEqual(double.questions.map((q) => [q.id, q.juste]), [["rds/ce/mas#00000001", false]]);
  // repondue absent : comptée comme répondue
  assert.equal(validerSerie(serie({ questions: [{ id: "rds/ce/mas#00000001", chapitre: "A", juste: false }] })).questions.length, 1);
});

test("série refusée", () => {
  const refusees = {
    "pas un objet": null, tableau: [], cle: serie({ cle: "A2/DS" }), "clé absente": serie({ cle: undefined }),
    annee: serie({ annee: "a3" }), "année nombre": serie({ annee: 2 }), "matière nombre": serie({ matiere: 3 }), "titre vide": serie({ titre: "  " }),
    "titre long": serie({ titre: "x".repeat(121) }), "titre objet": serie({ titre: {} }), mode: serie({ mode: "examen" }),
    "total 0": serie({ total: 0 }), "total décimal": serie({ total: 2.5 }), "total trop grand": serie({ total: QUESTIONS_PAR_SERIE_MAX + 1 }),
    "justes > total": serie({ justes: 4 }), "justes négatif": serie({ justes: -1 }), "justes texte": serie({ justes: "1" }),
    "note > 20": serie({ note20: 21 }), "note NaN": serie({ note20: NaN }), "pourcent > 100": serie({ pourcent: 101 }),
    "durée négative": serie({ duree_s: -1 }), "durée texte": serie({ duree_s: "10" }), "refaire texte": serie({ refaire: "oui" }),
    "questions absentes": serie({ questions: undefined }), "questions > total": serie({ total: 1, justes: 0 }),
    "question mal formée": serie({ questions: [{ id: "rds/ce/mas#xyz", chapitre: "A", juste: true }] }),
    "juste absent": serie({ questions: [{ id: "rds/ce/mas#00000001", chapitre: "A" }] }),
    "repondue texte": serie({ questions: [{ id: "rds/ce/mas#00000001", chapitre: "A", juste: true, repondue: "oui" }] }),
    "chapitre vide": serie({ questions: [{ id: "rds/ce/mas#00000001", chapitre: "", juste: true }] }),
    "question pas objet": serie({ questions: ["rds/ce/mas#00000001"] }),
  };
  for (const [nom, corps] of Object.entries(refusees)) assert.equal(validerSerie(corps), null, nom);
});

test("texte : invisibles retirés, longueur en caractères", () => {
  assert.equal(nettoyerTexte("a\u0000b\u2066c"), "a b c");
  assert.equal(nettoyerTexte("é".repeat(120)), "é".repeat(120));
  assert.equal(nettoyerTexte("é".repeat(121)), null);
  assert.equal(nettoyerTexte("\u200b"), "\u200b");  // pas un contrôle : gardé, affiché par textContent
});

test("limites par élève : plafond de questions, conservation deux ans", () => {
  const qs = [1, 2, 3, 4].map((i) => ({ id: "rds/ce/mas#" + H(i) }));
  const qsSans = [{ id: "exo/oi2-veille#00000001", annee: null, matiere: null }, { id: "exo/oi2-veille#00000002", annee: null, matiere: null }];
  assert.deepEqual(questionsAEnregistrer(qsSans, new Map([["exo/oi2-veille#00000002", { annee: "a2", matiere: "oi" }]]), 0),
    [{ id: "exo/oi2-veille#00000002", annee: "a2", matiere: "oi" }]);  // sans matière : seulement si déjà suivie
  qs.forEach((q) => Object.assign(q, { annee: "a2", matiere: "ce" }));
  const deja = new Map([["rds/ce/mas#00000003", { annee: "a2", matiere: "ce" }]]);
  assert.deepEqual(questionsAEnregistrer(qs, deja, QUESTIONS_PAR_ELEVE - 1).map((q) => q.id),
    ["rds/ce/mas#00000001", "rds/ce/mas#00000003"]);              // une place : la première nouvelle, et celle déjà suivie
  assert.deepEqual(questionsAEnregistrer(qs, deja, QUESTIONS_PAR_ELEVE + 10).map((q) => q.id), ["rds/ce/mas#00000003"]);
  assert.equal(questionsAEnregistrer(qs, new Map(), 0).length, 4);
  assert.equal(limiteConservation(MAINTENANT), "2024-11-14T12:00:00.000Z");
});

// ---------- vue prof : règles pures ----------

test("questions ratées : seuil de 5 élèves, tranches de 20 %, classement, sans total entre promos", () => {
  const r = assemblerQuestions({
    annee: "a2", matiere: "ce", maintenant: MAINTENANT, lignes: [
      { domaine: "2026.icam.fr", question: "rds/ce/mas#00000001", repondu: 10, rates: 9 },  // 90 % → 80-100
      { domaine: "2026.icam.fr", question: "rds/ce/mas#00000002", repondu: 5, rates: 1 },   // 20 % → 20-40
      { domaine: "2026.icam.fr", question: "rds/ce/mas#00000003", repondu: 4, rates: 4 },   // 4 élèves : absente
      { domaine: "2026.icam.fr", question: "rds/ce/mas#00000004", repondu: 30, rates: 0 },  // 0 % → 0-20
      { domaine: "2025.icam.fr", question: "rds/ce/mas#00000003", repondu: 3, rates: 3 },   // 3 + 4 : jamais additionnés
      { domaine: "icam.fr", question: "rds/ce/mas#00000001", repondu: 50, rates: 50 },      // pas une promo
      { domaine: "2026.icam.fr", question: "pas-un-id", repondu: 50, rates: 50 },
    ],
  });
  assert.deepEqual(r.promos, [
    { promo: "2025", questions: [] },
    { promo: "2026", questions: [
      { id: "rds/ce/mas#00000001", repondu: 10, echec: { min: 80, max: 100 } },
      { id: "rds/ce/mas#00000002", repondu: 5, echec: { min: 20, max: 40 } },
      { id: "rds/ce/mas#00000004", repondu: 30, echec: { min: 0, max: 20 } },
    ] },
  ]);
  assert.equal(r.seuil, 5);
  assert.equal(r.largeurTranche, 20);
  assert.doesNotMatch(JSON.stringify(r), /rates|taux/);
  assert.deepEqual(Object.keys(r).sort(), ["annee", "genereLe", "largeurTranche", "matiere", "promos", "seuil"]);
});

test("questions ratées : 50 par promo au plus", () => {
  const lignes = Array.from({ length: 80 }, (_, i) => ({ domaine: "2026.icam.fr", question: "rds/ce/mas#" + H(i), repondu: 6, rates: i % 7 }));
  const r = assemblerQuestions({ annee: "a2", matiere: "ce", maintenant: MAINTENANT, lignes });
  assert.equal(r.promos[0].questions.length, QUESTIONS_PAR_PROMO);
  assert.equal(r.promos[0].questions[0].echec.min, 80);  // 6 ratés sur 6 en tête
});

// ---------- SQL réel, sur SQLite intégré à Node (node:sqlite), avec les migrations ----------

let DatabaseSync = null;
try { ({ DatabaseSync } = await import("node:sqlite")); } catch { /* Node trop ancien : tests sautés */ }
const sansSqlite = DatabaseSync ? false : "node:sqlite indisponible (Node 22.13 ou plus récent)";

function fausseD1() {
  const base = new DatabaseSync(":memory:");
  base.exec("PRAGMA foreign_keys = ON");  // comme D1
  const dossier = new URL("../migrations/", import.meta.url);
  for (const f of readdirSync(dossier).filter((n) => n.endsWith(".sql")).sort()) {
    base.exec(readFileSync(new URL(f, dossier), "utf8"));
  }
  const requete = (sql, args = []) => ({
    bind: (...a) => requete(sql, a),
    all: async () => ({ results: base.prepare(sql).all(...args) }),
    first: async () => base.prepare(sql).get(...args) ?? null,
    run: async () => { const r = base.prepare(sql).run(...args); return { success: true, meta: { changes: r.changes } }; },
  });
  return {
    prepare: (sql) => requete(sql),
    batch: async (rs) => {
      base.exec("BEGIN");
      try { const r = []; for (const q of rs) r.push(await q.run()); base.exec("COMMIT"); return r; }
      catch (e) { base.exec("ROLLBACK"); throw e; }
    },
    base,
  };
}

async function sha256Hex(texte) {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

function ajouter(db, email) {
  return Number(db.base.prepare("INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?)")
    .run(email, new Date().toISOString(), new Date().toISOString()).lastInsertRowid);
}

async function ouvrir(db, utilisateurId) {
  const jeton = [...crypto.getRandomValues(new Uint8Array(32))].map((o) => o.toString(16).padStart(2, "0")).join("");
  db.base.prepare("INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le, methode) VALUES (?, ?, ?, 'google')")
    .run(await sha256Hex(jeton), utilisateurId, new Date(Date.now() + 3600e3).toISOString());
  return jeton;
}

const worker = (await import("../src/index.js")).default;
function appel(env, jeton, chemin, { methode = "GET", corps, origine } = {}) {
  const headers = {};
  if (jeton) headers.Cookie = "studicam_session=" + jeton;
  let body;
  if (corps !== undefined) {
    body = JSON.stringify(corps);
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(new TextEncoder().encode(body).length);
  }
  if (origine) headers.Origin = origine;
  return worker.fetch(new Request("https://studicam.pages.dev" + chemin, { method: methode, headers, body }), env);
}

test("POST puis GET /api/series : séries, carnet, sortie du carnet, cascade", { skip: sansSqlite }, async () => {
  const db = fausseD1();
  const env = { DB: db };
  const eleve = ajouter(db, "eleve@2026.icam.fr");
  const autre = ajouter(db, "autre@2026.icam.fr");
  const jeton = await ouvrir(db, eleve);
  const jetonAutre = await ouvrir(db, autre);

  assert.equal((await appel(env, null, "/api/series")).status, 401);
  assert.equal((await appel(env, null, "/api/series", { methode: "POST", corps: serie() })).status, 401);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "POST", corps: { x: 1 } })).status, 400);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "POST", corps: serie(), origine: "https://ailleurs.example" })).status, 403);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "DELETE" })).status, 405);

  const r1 = await appel(env, jeton, "/api/series", { methode: "POST", corps: serie() });
  assert.equal(r1.status, 201);
  let lu = await (await appel(env, jeton, "/api/series")).json();
  assert.equal(lu.series.length, 1);
  assert.equal(lu.series[0].note20, 6.67);
  assert.deepEqual(lu.carnet.map((q) => [q.id, q.echecs, q.chapitre]), [["rds/ce/mas#00000002", 1, "CE · Moteur asynchrone"]]);

  // la question ratée est réussie plus tard : elle sort du carnet, ses compteurs restent
  await appel(env, jeton, "/api/series", { methode: "POST", corps: serie({ refaire: true, total: 1, justes: 1, note20: 20, pourcent: 100,
    questions: [{ id: "rds/ce/mas#00000002", chapitre: "CE · Moteur asynchrone", juste: true, repondue: true }] }) });
  lu = await (await appel(env, jeton, "/api/series")).json();
  assert.deepEqual(lu.carnet, []);
  assert.equal(lu.series.length, 2);
  assert.equal(lu.series[0].refaire, true);
  const ligne = db.base.prepare("SELECT premier_juste, echecs, reussites, a_refaire FROM questions_suivi WHERE question = 'rds/ce/mas#00000002'").get();
  assert.deepEqual({ ...ligne }, { premier_juste: 0, echecs: 1, reussites: 1, a_refaire: 0 });

  // chacun ne voit que ses propres lignes
  const luAutre = await (await appel(env, jetonAutre, "/api/series")).json();
  assert.deepEqual(luAutre, { series: [], carnet: [] });

  // effacer le compte efface ses séries et son carnet
  db.base.prepare("DELETE FROM sessions WHERE utilisateur_id = ?").run(eleve);
  db.base.prepare("DELETE FROM utilisateurs WHERE id = ?").run(eleve);
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM series").get().n, 0);
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM questions_suivi").get().n, 0);
});

test("POST /api/series : limite de débit et plafonds de lignes", { skip: sansSqlite }, async () => {
  const db = fausseD1();
  const cles = [];
  const env = { DB: db, LIMITE_ECRITURE: { limit: async ({ key }) => { cles.push(key); return { success: cles.length <= 2 }; } } };
  const eleve = ajouter(db, "eleve@2026.icam.fr");
  const jeton = await ouvrir(db, eleve);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "POST", corps: serie() })).status, 201);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "POST", corps: serie() })).status, 201);
  assert.equal((await appel(env, jeton, "/api/series", { methode: "POST", corps: serie() })).status, 429);
  assert.deepEqual(cles, ["serie:" + eleve, "serie:" + eleve, "serie:" + eleve]);  // compteur à part de la progression

  // corps trop gros
  const gros = serie({ titre: "x".repeat(60), total: 300, justes: 0, questions: Array.from({ length: 300 }, (_, i) => ({
    id: "rds/expo/maintenance#" + H(i), chapitre: "y".repeat(120), juste: false, repondue: true })) });
  assert.equal((await appel({ DB: db }, jeton, "/api/series", { methode: "POST", corps: gros })).status, 413);

  // plafond de questions : à QUESTIONS_PAR_ELEVE lignes, les nouvelles questions sont ignorées
  const insere = db.base.prepare(`INSERT INTO questions_suivi (utilisateur_id, question, annee, matiere, chapitre, premier_juste, echecs, reussites, a_refaire, maj_le)
    VALUES (?, ?, 'a2', 'ce', 'C', 1, 0, 1, 0, ?)`);
  const maj = new Date().toISOString();
  db.base.exec("BEGIN");
  for (let i = 100; i < 100 + QUESTIONS_PAR_ELEVE - 3; i++) insere.run(eleve, "rds/ce/mas#" + H(i), maj);
  db.base.exec("COMMIT");
  const r = await (await appel({ DB: db }, jeton, "/api/series", { methode: "POST", corps: serie({ questions: [
    { id: "rds/ce/mas#00000001", chapitre: "A", juste: false }, { id: "rds/ce/mas#00000005", chapitre: "A", juste: false },
    { id: "rds/ce/mas#00000006", chapitre: "A", juste: false }] }) })).json();
  assert.deepEqual(r, { ok: true, questions: 2, ignorees: 1 });  // 00000001 déjà suivie + une seule place
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM questions_suivi WHERE utilisateur_id = ?").get(eleve).n, QUESTIONS_PAR_ELEVE);

  // plafond de séries : les plus anciennes sont supprimées ; plus de deux ans : supprimées
  const ins = db.base.prepare(`INSERT INTO series (utilisateur_id, cle, annee, matiere, titre, mode, total, justes, note20, pourcent, fait_le)
    VALUES (?, 'a2/ce/x', 'a2', 'ce', 'T', 'ds', 1, 1, 20, 100, ?)`);
  db.base.exec("BEGIN");
  ins.run(eleve, "2020-01-01T00:00:00.000Z");
  for (let i = 0; i < SERIES_PAR_ELEVE; i++) ins.run(eleve, new Date(Date.now() - (i + 1) * 60e3).toISOString());
  db.base.exec("COMMIT");
  db.base.prepare("UPDATE questions_suivi SET maj_le = '2020-01-01T00:00:00.000Z' WHERE question = 'rds/ce/mas#00000100'").run();
  assert.equal((await appel({ DB: db }, jeton, "/api/series", { methode: "POST", corps: serie() })).status, 201);
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM series WHERE utilisateur_id = ?").get(eleve).n, SERIES_PAR_ELEVE);
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM series WHERE fait_le < '2021-01-01'").get().n, 0);
  assert.equal(db.base.prepare("SELECT COUNT(*) AS n FROM questions_suivi WHERE question = 'rds/ce/mas#00000100'").get().n, 0);
});

// Promo 2026 : 6 élèves sur mas#1 (5 ratés du premier coup), 4 sur mas#2 (masquée), une question OI.
// Un compte équipe à adresse de promo et un prof ont aussi répondu : jamais comptés.
async function remplirQuestions(db) {
  const env = { DB: db };
  const eleves = [];
  for (let i = 0; i < 6; i++) eleves.push(ajouter(db, `eleve${i}@2026.icam.fr`));
  const equipe = ajouter(db, "responsable@2026.icam.fr");
  db.base.prepare("INSERT INTO roles (email, role, perimetre) VALUES ('responsable@2026.icam.fr', 'equipe', '')").run();
  const prof = ajouter(db, "prof.ce@icam.fr");
  db.base.prepare("INSERT INTO roles (email, role, perimetre) VALUES ('prof.ce@icam.fr', 'prof', 'a2/ce')").run();
  const envoyer = async (id, questions) => {
    const r = await appel(env, await ouvrir(db, id), "/api/series", { methode: "POST", corps: serie({ total: 3, justes: 0, questions }) });
    assert.equal(r.status, 201);
  };
  for (const [i, id] of eleves.entries()) {
    const qs = [{ id: "rds/ce/mas#00000001", chapitre: "CE · MAS", juste: i === 0 }];
    if (i < 4) qs.push({ id: "rds/ce/mas#00000002", chapitre: "CE · MAS", juste: false });
    qs.push({ id: "rds/cours/msp#00000003", chapitre: "OI · MSP", juste: false });
    await envoyer(id, qs);
    // ils refont leurs erreurs et réussissent : le taux reste celui de la première réponse
    await envoyer(id, [{ id: "rds/ce/mas#00000001", chapitre: "CE · MAS", juste: true }]);
  }
  await envoyer(equipe, [{ id: "rds/ce/mas#00000002", chapitre: "CE · MAS", juste: false }]);
  await envoyer(prof, [{ id: "rds/ce/mas#00000002", chapitre: "CE · MAS", juste: false }]);
  return { eleve: eleves[0], prof, equipe };
}

test("GET /api/prof/questions : agrégats, seuil, rien de nominatif, périmètre", { skip: sansSqlite }, async () => {
  const db = fausseD1();
  const env = { DB: db };
  const { eleve, prof, equipe } = await remplirQuestions(db);
  const jetonProf = await ouvrir(db, prof);
  const jetonEleve = await ouvrir(db, eleve);
  const jetonEquipe = await ouvrir(db, equipe);

  assert.equal((await appel(env, null, "/api/prof/questions?annee=a2&matiere=ce")).status, 401);
  assert.equal((await appel(env, jetonEleve, "/api/prof/questions?annee=a2&matiere=ce")).status, 403);
  assert.equal((await appel(env, jetonProf, "/api/prof/questions?annee=a2&matiere=oi")).status, 403);
  assert.equal((await appel(env, jetonProf, "/api/prof/questions?annee=a2&matiere=x'--")).status, 403);
  assert.equal((await appel(env, jetonProf, "/api/prof/questions")).status, 403);
  assert.equal((await appel(env, jetonProf, "/api/prof/questions?annee=a2&matiere=ce", { methode: "POST", corps: {} })).status, 405);

  const ok = await appel(env, jetonProf, "/api/prof/questions?annee=a2&matiere=ce");
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Cache-Control"), "no-store");
  const r = await ok.json();
  // mas#1 : 6 élèves, 5 ratés du premier coup (83 %) ; mas#2 : 4 élèves (le prof et l'équipe
  // ne comptent pas), absente ; msp est en OI
  assert.deepEqual(r.promos, [{ promo: "2026", questions: [{ id: "rds/ce/mas#00000001", repondu: 6, echec: { min: 80, max: 100 } }] }]);
  const texte = JSON.stringify(r);
  assert.doesNotMatch(texte, /@|eleve|responsable|prof\.ce|CE · MAS|chapitre/);
  for (const q of r.promos[0].questions) assert.deepEqual(Object.keys(q).sort(), ["echec", "id", "repondu"]);  // pas le nombre de ratés

  // equipe voit tout
  const oi = await (await appel(env, jetonEquipe, "/api/prof/questions?annee=a2&matiere=oi")).json();
  assert.deepEqual(oi.promos[0].questions, [{ id: "rds/cours/msp#00000003", repondu: 6, echec: { min: 80, max: 100 } }]);
  // un prof sans rôle n'y accède plus dès la requête suivante
  db.base.prepare("DELETE FROM roles WHERE email = 'prof.ce@icam.fr'").run();
  assert.equal((await appel(env, jetonProf, "/api/prof/questions?annee=a2&matiere=ce")).status, 403);
});

// ---------- page élève : calculs (public/ma-progression.js) ----------

test("ma progression : tendance, résumé, carnet groupé, corps envoyé", async () => {
  const { runInNewContext } = await import("node:vm");
  const fenetre = {};
  const document = { addEventListener() {}, getElementById: () => null, querySelector: () => null, readyState: "complete" };
  runInNewContext(readFileSync(new URL("../public/ma-progression.js", import.meta.url), "utf8"),
    { window: fenetre, document, console: { warn() {} } });
  const mp = fenetre.studicamMaProgression;
  const brut = (v) => JSON.parse(JSON.stringify(v));

  assert.equal(mp.tendance([12]), null);
  assert.deepEqual(brut(mp.tendance([10, 12])), { sens: "hausse", ecart: 2 });
  assert.deepEqual(brut(mp.tendance([20, 8, 10, 12, 10.5])), { sens: "stable", ecart: 0.5 });  // 3 précédentes : 10
  assert.deepEqual(brut(mp.tendance([15, 13])), { sens: "baisse", ecart: -2 });

  const d = {
    series: [
      { cle: "a2/ds/ds-2026-11/examen-ce", annee: "a2", matiere: "ce", note20: 14, refaire: false, fait_le: "2026-11-13T10:00:00Z" },
      { cle: "serie/refaire", annee: "a2", matiere: "ce", note20: 20, refaire: true, fait_le: "2026-11-14T10:00:00Z" },
      { cle: "a2/ds/ds-2026-11/examen-ce", annee: "a2", matiere: "ce", note20: 11, refaire: false, fait_le: "2026-11-12T10:00:00Z" },
      { cle: "a2/ds/ds-2026-11/examen-tout", annee: "a2", matiere: null, note20: 9, refaire: false, fait_le: "2026-11-12T10:00:00Z" },
    ],
    carnet: [
      { id: "rds/ce/mas#00000001", annee: "a2", matiere: "ce", chapitre: "CE · MAS" },
      { id: "rds/cours/msp#00000002", annee: "a2", matiere: "oi", chapitre: "OI · MSP" },
      { id: "rds/ce/mas#00000003", annee: "a2", matiere: "ce", chapitre: "CE · MAS" },
    ],
  };
  const r = mp.resume(d, (s) => s.annee === "a2" && s.matiere === "ce", (q) => q.matiere === "ce");
  assert.equal(r.derniere.note20, 14);       // la série « Refaire » ne compte pas
  assert.deepEqual(brut(r.tendance), { sens: "hausse", ecart: 3 });
  assert.equal(r.erreurs, 2);
  assert.equal(r.series, 2);
  assert.equal(mp.groupeDeSerie(d.series[3]), "mixte");
  assert.deepEqual(brut(mp.grouperCarnet(d.carnet)).map((g) => [g.chapitre, g.questions.length]), [["CE · MAS", 2], ["OI · MSP", 1]]);

  // corps envoyé : seulement les champs du contrat ; rien si aucune réponse
  const detail = { cle: "a2/ds/ds-2026-11/examen-ce", annee: "a2", matiere: "ce", titre: "Examen", mode: "ds", total: 2, justes: 1,
    note20: 10, pourcent: 50, duree_s: 30, autre: "x", questions: [{ id: "rds/ce/mas#00000001", chapitre: "C", juste: true, repondue: true, q: "énoncé" },
      { id: "rds/ce/mas#00000002", chapitre: "C", juste: false, repondue: false }] };
  const corps = brut(mp.corpsSerie(detail, true));
  assert.deepEqual(Object.keys(corps).sort(), ["annee", "cle", "duree_s", "justes", "matiere", "mode", "note20", "pourcent", "questions", "refaire", "titre", "total"]);
  assert.deepEqual(corps.questions[0], { id: "rds/ce/mas#00000001", chapitre: "C", juste: true, repondue: true });
  assert.ok(validerSerie(corps), "le corps construit par la page passe la validation du serveur");
  assert.equal(mp.corpsSerie({ ...detail, questions: [{ id: "rds/ce/mas#00000002", chapitre: "C", juste: false, repondue: false }] }), null);
  assert.equal(mp.corpsSerie(null), null);
});
