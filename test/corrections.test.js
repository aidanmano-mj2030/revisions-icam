// Corrections de cours : règles pures, liste des leçons à jour, et routes de bout en bout par
// le fetch du Worker sur une D1 simulée par node:sqlite (toutes les migrations).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import worker from "../src/index.js";
import { ACTIVES_PAR_LECON } from "../src/prof-corrections.js";
import { LIEUX_LECONS } from "../src/lecons.js";
import { lieuxDepuisIndex } from "../scripts/maj-lecons.mjs";
import {
  validerCorrection, validerAnnulation, nettoyerTexte, blocValide, paireAutorisee, lieuxLecon,
  TEXTE_MAX, CORRECTIONS_PAR_JOUR,
} from "../src/regles-corrections.js";

const ORIGINE = "https://studicam.pages.dev";
const DOSSIER = new URL("../migrations/", import.meta.url);

test("src/lecons.js suit CHAPITRES de public/index.html (sinon : node scripts/maj-lecons.mjs)", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  assert.deepEqual(LIEUX_LECONS, lieuxDepuisIndex(html));
  assert.deepEqual(LIEUX_LECONS["ce2-triphase"], ["a2/ce"]);
  assert.deepEqual(LIEUX_LECONS["aii-grafcet"], ["a1/aii"]);
});

test("blocs et leçons", () => {
  for (const b of ["p-1k3x9za", "formule-0", "note-abc", "li-zz", "td-123456789012", "td-0-2", "td-abc-9999"]) assert.ok(blocValide(b), b);
  for (const b of ["", "p-", "x-12", "p-ABC", "p-1234567890123", "p-1 2", "p_12", "td-0-1", "td-0-0", "td-0-10000", "td-0-", "td-0-2-3", null, 3]) assert.equal(blocValide(b), false, String(b));
  assert.deepEqual(lieuxLecon("ce2-triphase"), ["a2/ce"]);
  assert.deepEqual(lieuxLecon("inconnue"), []);
  assert.deepEqual(lieuxLecon("__proto__"), []);
  assert.deepEqual(lieuxLecon("constructor"), []);
});

test("texte nettoyé et commandes TeX refusées", () => {
  assert.equal(nettoyerTexte("  La **tension** $U = RI$\r\nligne 2\t "), "La **tension** $U = RI$\nligne 2");
  assert.equal(nettoyerTexte("é".repeat(TEXTE_MAX)), "é".repeat(TEXTE_MAX));
  for (const t of ["", "   ", "a".repeat(TEXTE_MAX + 1), null, 4, ["x"],
    "$\\href{javascript:alert(1)}{x}$", "\\class{a}{b}", "$\\style{color:red}{x}$", "\\cssId{x}{y}",
    "\\def\\frac{x}", "$\\newcommand{\\R}{x}$", "\\renewcommand\\a{b}", "\\require{html}", "\\let\\a\\b",
    "\\htmlData{x}{y}", "\\unicode{65}", "\\setOptions[tex]{x}", "$\\rule{3000px}{3000px}$", "$\\llap{x}$", "$\\kern-900em x$",
    "$\\hspace{99cm}$", "$\\raise{9em}{x}$", "$\\raisebox{9em}{x}$"]) {
    assert.equal(nettoyerTexte(t), null, String(t));
  }
  // une commande qui commence pareil mais n'est pas interdite
  assert.equal(nettoyerTexte("$\\default \\letter \\defin \\urlx$"), "$\\default \\letter \\defin \\urlx$");
  assert.equal(nettoyerTexte("$\\frac{a}{b} \\leq \\left( x \\right)$"), "$\\frac{a}{b} \\leq \\left( x \\right)$");
});

test("corps de correction et d'annulation", () => {
  const base = { lecon: "ce2-triphase", bloc: "p-1k3x9za", original: "<strong>U</strong> = RI", texte: "**U** = R·I" };
  assert.deepEqual(validerCorrection({ ...base, autre: 1 }), base);
  for (const corps of [null, [], "x", {}, { ...base, lecon: "../x" }, { ...base, lecon: "CE" }, { ...base, bloc: "x-1" },
    { ...base, original: "" }, { ...base, original: "a".repeat(TEXTE_MAX + 1) }, { ...base, texte: "" }, { ...base, texte: { t: 1 } },
    { ...base, texte: "\\href{x}{y}" }]) {
    assert.equal(validerCorrection(corps), null, JSON.stringify(corps));
  }
  assert.deepEqual(validerAnnulation({ id: 3 }), { id: 3 });
  for (const c of [null, {}, { id: 0 }, { id: -1 }, { id: 1.5 }, { id: "3" }]) assert.equal(validerAnnulation(c), null);
});

test("périmètre d'une leçon : jamais d'après le client", () => {
  assert.deepEqual(paireAutorisee("prof", ["a2/ce"], "ce2-triphase"), { annee: "a2", matiere: "ce" });
  assert.equal(paireAutorisee("prof", ["a2/oi"], "ce2-triphase"), null);
  assert.equal(paireAutorisee("prof", ["a1/ce"], "ce2-triphase"), null);
  assert.deepEqual(paireAutorisee("equipe", [], "aii-grafcet"), { annee: "a1", matiere: "aii" });
  assert.equal(paireAutorisee("equipe", [], "inconnue"), null);
  assert.equal(paireAutorisee(null, [], "ce2-triphase"), null);
});

// ---------- routes ----------
function d1(db) {
  const requete = (sql, valeurs = []) => ({
    bind: (...v) => requete(sql, v),
    first: async () => db.prepare(sql).get(...valeurs) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...valeurs) }),
    run: async () => { const r = db.prepare(sql).run(...valeurs); return { meta: { changes: r.changes, last_row_id: Number(r.lastInsertRowid) } }; },
  });
  return {
    prepare: (sql) => requete(sql),
    // transaction, comme le batch de D1
    batch: async (liste) => {
      db.exec("BEGIN");
      try { const r = []; for (const q of liste) r.push(await q.run()); db.exec("COMMIT"); return r; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
}

let db, env, jetons;
const J = new Date().toISOString();

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
    prof: ouvrirSession("jean-marc.vouriot@icam.fr", "prof", "a2/ce,a1/ce"),
    profOi: ouvrirSession("prof.oi@icam.fr", "prof", "a2/oi"),
    equipe: ouvrirSession("aidan.mano@2030.icam.fr", "equipe"),
  };
});

async function appeler(qui, methode, chemin, corps, enTetes = {}) {
  const h = { ...enTetes };
  if (qui) h.Cookie = "studicam_session=" + jetons[qui];
  let body;
  if (corps !== undefined) {
    body = typeof corps === "string" ? corps : JSON.stringify(corps);
    h["Content-Type"] ??= "application/json";
    h["Content-Length"] = String(Buffer.byteLength(body));
  }
  const reponse = await worker.fetch(new Request(ORIGINE + chemin, { method: methode, headers: h, body }), env);
  return { statut: reponse.status, corps: await reponse.json() };
}

const CORR = { lecon: "ce2-triphase", bloc: "p-1k3x9za", original: "La tension <strong>composée</strong>", texte: "La tension **composée** $U = \\sqrt{3}\\,V$" };

test("un élève lit les corrections actives, sans adresse, et ne peut pas en écrire", async () => {
  assert.equal((await appeler(null, "GET", "/api/corrections?lecon=ce2-triphase")).statut, 401);
  assert.equal((await appeler("eleve", "POST", "/api/prof/corrections", CORR)).statut, 403);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", CORR)).statut, 201);
  const r = await appeler("eleve", "GET", "/api/corrections?lecon=ce2-triphase");
  assert.equal(r.statut, 200);
  assert.equal(r.corps.corrections.length, 1);
  const c = r.corps.corrections[0];
  assert.deepEqual(Object.keys(c).sort(), ["bloc", "id", "le", "lecon", "nom", "texte"]);
  assert.equal(c.nom, "Jean-Marc Vouriot");
  assert.match(c.le, /^\d{4}-\d{2}-\d{2}$/);
  assert.doesNotMatch(JSON.stringify(r.corps), /@|original/);
});

test("un prof ne corrige que les leçons de sa matière, quoi qu'il déclare", async () => {
  assert.equal((await appeler("profOi", "POST", "/api/prof/corrections", CORR)).statut, 403);
  // annee/matiere envoyées par le client : ignorées
  assert.equal((await appeler("profOi", "POST", "/api/prof/corrections", { ...CORR, annee: "a2", matiere: "oi" })).statut, 403);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, lecon: "aii-grafcet" })).statut, 403);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, lecon: "lecon-inconnue" })).statut, 400);
  assert.equal((await appeler("equipe", "POST", "/api/prof/corrections", { ...CORR, lecon: "aii-grafcet" })).statut, 201);
  const ligne = db.prepare("SELECT annee, matiere FROM corrections WHERE lecon = 'aii-grafcet'").get();
  assert.deepEqual({ ...ligne }, { annee: "a1", matiere: "aii" });
});

test("une seule correction active par bloc, l'historique est gardé", async () => {
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", CORR)).statut, 201);
  const r2 = await appeler("equipe", "POST", "/api/prof/corrections", { ...CORR, texte: "Deuxième version" });
  assert.equal(r2.statut, 201);
  const actives = (await appeler("eleve", "GET", "/api/corrections?lecon=ce2-triphase")).corps.corrections;
  assert.equal(actives.length, 1);
  assert.equal(actives[0].texte, "Deuxième version");
  const statuts = db.prepare("SELECT statut FROM corrections ORDER BY id").all().map((l) => l.statut);
  assert.deepEqual(statuts, ["remplacee", "active"]);
});

test("liste de l'Espace prof : périmètre, original, adresse pour l'équipe seulement", async () => {
  await appeler("prof", "POST", "/api/prof/corrections", CORR);
  await appeler("equipe", "POST", "/api/prof/corrections", { ...CORR, lecon: "aii-grafcet" });
  const prof = (await appeler("prof", "GET", "/api/prof/corrections")).corps.corrections;
  assert.deepEqual(prof.map((c) => c.lecon), ["ce2-triphase"]);
  assert.equal(prof[0].original, CORR.original);
  assert.equal(prof[0].moi, true);
  assert.equal(prof[0].email_prof, undefined);
  assert.deepEqual((await appeler("profOi", "GET", "/api/prof/corrections")).corps.corrections, []);
  const equipe = (await appeler("equipe", "GET", "/api/prof/corrections")).corps.corrections;
  assert.deepEqual(equipe.map((c) => c.lecon), ["aii-grafcet", "ce2-triphase"]);
  assert.equal(equipe[1].email_prof, "jean-marc.vouriot@icam.fr");
  assert.equal((await appeler("eleve", "GET", "/api/prof/corrections")).statut, 403);
});

test("revenir au texte d'origine", async () => {
  const id = (await appeler("prof", "POST", "/api/prof/corrections", CORR)).corps.correction.id;
  assert.ok(Number.isInteger(id));
  assert.equal((await appeler("profOi", "DELETE", "/api/prof/corrections", { id })).statut, 403);
  assert.equal((await appeler("eleve", "DELETE", "/api/prof/corrections", { id })).statut, 403);
  assert.equal((await appeler("equipe", "DELETE", "/api/prof/corrections", { id: 999 })).statut, 404);
  assert.equal((await appeler("equipe", "DELETE", "/api/prof/corrections", { id })).statut, 200);
  assert.equal((await appeler("prof", "DELETE", "/api/prof/corrections", { id })).statut, 409);
  assert.deepEqual((await appeler("eleve", "GET", "/api/corrections?lecon=ce2-triphase")).corps.corrections, []);
  const l = db.prepare("SELECT statut, annule_par FROM corrections WHERE id = ?").get(id);
  assert.deepEqual({ ...l }, { statut: "annulee", annule_par: "aidan.mano@2030.icam.fr" });
});

test("contrôles d'envoi : TeX dangereux, taille, origine", async () => {
  const href = await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, texte: "$\\href{javascript:alert(1)}{clic}$" });
  assert.equal(href.statut, 400);
  // 3000 caractères accentués de chaque côté passent (corps de plus de 4 Ko)
  const long = { ...CORR, original: "é".repeat(TEXTE_MAX), texte: "è".repeat(TEXTE_MAX) };
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", long)).statut, 201);
  const trop = JSON.stringify({ ...CORR, texte: "x".repeat(40000) });
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", trop)).statut, 413);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", CORR, { Origin: "https://ailleurs.example" })).statut, 403);
});

test(`limite de ${CORRECTIONS_PAR_JOUR} corrections par prof et par jour`, async () => {
  const insert = db.prepare(`INSERT INTO corrections (lecon, bloc, annee, matiere, original, texte, email_prof, cree_le, statut)
    VALUES ('ce2-triphase', ?, 'a2', 'ce', 'o', 't', 'jean-marc.vouriot@icam.fr', ?, 'remplacee')`);
  for (let i = 0; i < CORRECTIONS_PAR_JOUR; i++) insert.run("p-" + i.toString(36), J);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", CORR)).statut, 429);
  assert.equal((await appeler("equipe", "POST", "/api/prof/corrections", CORR)).statut, 201);
});

test("lecture par leçon : leçon obligatoire, rien des autres leçons", async () => {
  await appeler("prof", "POST", "/api/prof/corrections", CORR);
  await appeler("equipe", "POST", "/api/prof/corrections", { ...CORR, lecon: "aii-grafcet" });
  assert.equal((await appeler("eleve", "GET", "/api/corrections")).statut, 400);
  assert.equal((await appeler("eleve", "GET", "/api/corrections?lecon=../x")).statut, 400);
  const r = (await appeler("eleve", "GET", "/api/corrections?lecon=aii-grafcet")).corps.corrections;
  assert.deepEqual(r.map((c) => c.lecon), ["aii-grafcet"]);
  assert.deepEqual((await appeler("eleve", "GET", "/api/corrections?lecon=ce2-dimensions")).corps.corrections, []);
});

test("même texte deux fois dans une leçon : deux blocs distincts", async () => {
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, bloc: "td-0", original: "0", texte: "1" })).statut, 201);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, bloc: "td-0-2", original: "0", texte: "0,5" })).statut, 201);
  const r = (await appeler("eleve", "GET", "/api/corrections?lecon=ce2-triphase")).corps.corrections;
  assert.deepEqual(r.map((c) => [c.bloc, c.texte]), [["td-0", "1"], ["td-0-2", "0,5"]]);
});

test(`au plus ${ACTIVES_PAR_LECON} corrections actives par leçon, remplacement toujours permis`, async () => {
  const insert = db.prepare(`INSERT INTO corrections (lecon, bloc, annee, matiere, original, texte, email_prof, cree_le, statut)
    VALUES ('ce2-triphase', ?, 'a2', 'ce', 'o', 't', 'autre.prof@icam.fr', '2026-01-01T00:00:00.000Z', 'active')`);
  for (let i = 0; i < ACTIVES_PAR_LECON; i++) insert.run("p-" + i.toString(36));
  const refus = await appeler("prof", "POST", "/api/prof/corrections", CORR);
  assert.equal(refus.statut, 429);
  // rien n'a été remplacé par la tentative refusée
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM corrections WHERE statut = 'active'").get().n, ACTIVES_PAR_LECON);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, bloc: "p-0" })).statut, 201);
  assert.equal((await appeler("prof", "POST", "/api/prof/corrections", { ...CORR, lecon: "ce2-dimensions" })).statut, 201);
});
