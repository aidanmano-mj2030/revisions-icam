import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  SEUIL_ELEVES, LARGEUR_TRANCHE, promoDeDomaine, promoDeEmail, masquer, debutActivite, trancheReussite, assemblerStats,
} from "../src/regles-stats.js";
import { clesDsDeMatiere } from "../src/regles.js";

// ---------- règles pures ----------

test("promo lue dans le domaine de l'adresse", () => {
  assert.equal(promoDeEmail("prenom.nom@2027.icam.fr"), "2027");
  assert.equal(promoDeEmail("x@2030.ICAM.fr"), "2030");
  assert.equal(promoDeDomaine("2028.icam.fr"), "2028");
  for (const email of [
    "prof@icam.fr", "x@toulouse.icam.fr", "x@a2-toulouse.icam.fr", "x@20271.icam.fr", "x@202.icam.fr",
    "x@2027a.icam.fr", "x@2027.2028.icam.fr", "x@a.b.icam.fr", "x@2027.icam.com", "x@2027.fauxicam.fr", "x@-a.icam.fr",
    "x@.icam.fr", "2027.icam.fr", "", null, undefined, 42,
  ]) {
    assert.equal(promoDeEmail(email), null, String(email));
  }
});

test("seuil de 5 élèves", () => {
  assert.equal(SEUIL_ELEVES, 5);
  assert.equal(masquer(5), 5);
  assert.equal(masquer(30), 30);
  for (const n of [4, 1, 0, null, undefined, "x", NaN]) assert.equal(masquer(n), null, String(n));
});

test("début de la fenêtre d'activité", () => {
  assert.equal(debutActivite(Date.UTC(2026, 10, 12, 10)), "2026-11-05T10:00:00.000Z");
});

test("tranches du taux de réussite : [0, 20[, [20, 40[, [40, 60[, [60, 80[, [80, 100]", () => {
  assert.equal(LARGEUR_TRANCHE, 20);
  const t = (r, n) => trancheReussite(r, n);
  assert.deepEqual(t(0, 7), { min: 0, max: 20 });      // 0 %
  assert.deepEqual(t(2, 30), { min: 0, max: 20 });     // 6,7 %
  assert.deepEqual(t(19, 100), { min: 0, max: 20 });   // 19 %
  assert.deepEqual(t(1, 5), { min: 20, max: 40 });     // 20 % pile : tranche du dessus
  assert.deepEqual(t(2, 5), { min: 40, max: 60 });
  assert.deepEqual(t(3, 5), { min: 60, max: 80 });
  assert.deepEqual(t(59, 100), { min: 40, max: 60 });
  assert.deepEqual(t(4, 5), { min: 80, max: 100 });    // 80 % pile
  assert.deepEqual(t(7, 7), { min: 80, max: 100 });    // 100 %
  assert.deepEqual(t(1, 3), { min: 20, max: 40 });     // 33,3 %
  for (const [r, n] of [[0, 0], [1, 0], [6, 5], [-1, 5], [1.5, 5], [null, 5], ["2", 5]]) {
    assert.equal(t(r, n), null, `${r}/${n}`);
  }
});

test("clés de la Révision DS d'une matière", () => {
  assert.ok(clesDsDeMatiere("a2", "ce").includes("a2/ds/ds-2026-11/mcc"));
  assert.ok(clesDsDeMatiere("a2", "ce").includes("a2/ds/ds-2026-11/examen-ce"));
  const oi = clesDsDeMatiere("a2", "oi");
  assert.ok(oi.includes("a2/ds/ds-2026-11/kanban") && oi.includes("a2/ds/ds-2026-11/examen-expo"));
  assert.ok(!oi.includes("a2/ds/ds-2026-11/mcc"));
  for (const cles of [clesDsDeMatiere("a2", "ce"), oi]) assert.ok(!cles.some((c) => c.endsWith("examen-tout")));
  assert.deepEqual(clesDsDeMatiere("a1", "ce"), []);
  assert.deepEqual(clesDsDeMatiere("a2", "annee"), []);
  assert.deepEqual(clesDsDeMatiere("a2", "x"), []);
});

const MAINTENANT = Date.UTC(2026, 10, 12, 10);
const garderCe = (cle) => cle.startsWith("a2/ce/");

test("assemblage : tranches, petits groupes, promos sans tentative", () => {
  const r = assemblerStats({
    annee: "a2", matiere: "ce", maintenant: MAINTENANT, garderCle: garderCe,
    effectifs: [
      { domaine: "2027.icam.fr", inscrits: 12, actifs: 3 },
      { domaine: "2028.icam.fr", inscrits: 4, actifs: 4 },
      { domaine: "2029.icam.fr", inscrits: 40, actifs: 20 },   // aucun exercice de CE : présente quand même
      { domaine: "icam.fr", inscrits: 9, actifs: 9 },          // profs : ignorés
    ],
    cles: [
      { domaine: "2027.icam.fr", cle: "a2/ce/x/a", tentes: 6, reussis: 2, score_moyen: 61.6, scores: 6 },
      { domaine: "2027.icam.fr", cle: "a2/ce/x/b", tentes: 4, reussis: 4, score_moyen: 90, scores: 4 },
      { domaine: "2027.icam.fr", cle: "a2/ce/x/c", tentes: 7, reussis: 0, score_moyen: 20, scores: 3 },
      { domaine: "2027.icam.fr", cle: "a2/oi/y/a", tentes: 9, reussis: 9, score_moyen: 100, scores: 9 },
      { domaine: "2028.icam.fr", cle: "a2/ce/x/a", tentes: 4, reussis: 1, score_moyen: 50, scores: 4 },
      { domaine: "icam.fr", cle: "a2/ce/x/a", tentes: 9, reussis: 9, score_moyen: 100, scores: 9 },
    ],
    eleves: [
      { domaine: "2027.icam.fr", eleves: 8 },
      { domaine: "2028.icam.fr", eleves: 4 },
      { domaine: "2029.icam.fr", eleves: 3 },   // moins de 5 : masqué
      { domaine: "icam.fr", eleves: 9 },
    ],
  });
  assert.equal(r.seuil, 5);
  assert.equal(r.largeurTranche, 20);
  assert.equal(r.genereLe, "2026-11-12T10:00:00.000Z");
  assert.deepEqual(r.promos, [
    {
      promo: "2027", inscrits: 12, actifs: null, eleves: 8,
      cles: {
        "a2/ce/x/a": { tentes: 6, reussite: { min: 20, max: 40 }, scoreMoyen: 62 },
        "a2/ce/x/c": { tentes: 7, reussite: { min: 0, max: 20 }, scoreMoyen: null },
      },
    },
    { promo: "2028", inscrits: null, actifs: null, eleves: null, cles: {} },
    { promo: "2029", inscrits: 40, actifs: 20, eleves: null, cles: {} },
  ]);
});

// Aucun chiffre de 1 à 4 ne doit sortir sur les groupes comptés (inscrits, actifs, tentés).
function chiffresSousSeuil(reponse) {
  const trouves = [];
  for (const p of reponse.promos) {
    for (const [nom, v] of [["inscrits", p.inscrits], ["actifs", p.actifs], ["eleves", p.eleves]]) {
      if (v !== null && v < SEUIL_ELEVES) trouves.push(`${p.promo} ${nom}=${v}`);
    }
    for (const [cle, s] of Object.entries(p.cles)) {
      if (!(s.tentes >= SEUIL_ELEVES)) trouves.push(`${p.promo} ${cle} tentes=${s.tentes}`);
    }
  }
  return trouves;
}

// Tous les nombres d'une réponse JSON, où qu'ils soient.
function nombres(valeur, acc = []) {
  if (typeof valeur === "number") acc.push(valeur);
  else if (valeur && typeof valeur === "object") Object.values(valeur).forEach((v) => nombres(v, acc));
  return acc;
}

// ---------- SQL réel, sur SQLite intégré à Node (node:sqlite), avec les migrations ----------

let DatabaseSync = null;
try { ({ DatabaseSync } = await import("node:sqlite")); } catch { /* Node trop ancien : tests sautés */ }
const sansSqlite = DatabaseSync ? false : "node:sqlite indisponible (Node 22.13 ou plus récent)";

// Imite le binding D1 utilisé par le Worker : prepare().bind().all()/first()/run(), batch().
function fausseD1() {
  const base = new DatabaseSync(":memory:");
  const dossier = new URL("../migrations/", import.meta.url);
  for (const f of readdirSync(dossier).filter((n) => n.endsWith(".sql")).sort()) {
    base.exec(readFileSync(new URL(f, dossier), "utf8"));
  }
  const requete = (sql, args = []) => ({
    bind: (...a) => requete(sql, a),
    all: async () => ({ results: base.prepare(sql).all(...args) }),
    first: async () => base.prepare(sql).get(...args) ?? null,
    run: async () => { base.prepare(sql).run(...args); return { success: true }; },
  });
  return { prepare: (sql) => requete(sql), batch: async (rs) => Promise.all(rs.map((r) => r.run())), base };
}

const IL_Y_A = (jours) => new Date(MAINTENANT - jours * 24 * 3600 * 1000).toISOString();

// Promo 2026 : 30 élèves (20 actifs), seule à travailler.
// Promo 2027 : 6 élèves (5 actifs), aucune tentative. Promo 2028 : 4 élèves, aucune tentative.
// Promo 2025 : 4 élèves qui ont tous tenté tri. Un prof en @icam.fr, 6 agents @toulouse.icam.fr.
function remplir(db) {
  const ajouter = (email, vu) => Number(db.base.prepare(
    "INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?)"
  ).run(email, IL_Y_A(60), vu).lastInsertRowid);
  const promo = (annee, n, actifs) => Array.from({ length: n }, (_, i) => ajouter(`eleve${i}@${annee}.icam.fr`, IL_Y_A(i < actifs ? 1 : 20)));
  const a = promo(2026, 30, 20);
  promo(2027, 6, 5);
  promo(2028, 4, 4);
  const d = promo(2025, 4, 4);
  const prof = ajouter("prof.ce@icam.fr", IL_Y_A(0));
  // compte de l'équipe avec une adresse de promo : jamais compté comme élève
  const equipe = ajouter("responsable@2026.icam.fr", IL_Y_A(0));
  db.base.prepare("INSERT INTO roles (email, role, perimetre) VALUES ('responsable@2026.icam.fr', 'equipe', '')").run();
  const personnel = Array.from({ length: 6 }, (_, i) => ajouter(`agent${i}@toulouse.icam.fr`, IL_Y_A(1)));
  const p = (id, cle, reussi, score = null) => db.base.prepare(
    "INSERT INTO progression (utilisateur_id, cle, reussi, score, maj_le) VALUES (?, ?, ?, ?, ?)"
  ).run(id, cle, reussi, score, IL_Y_A(2));

  // 2026 : chx tenté par 30, 2 réussis (6,7 %, score moyen 53,3) ; asy tenté par 7, aucun réussi ;
  // tri tenté par 3 (masqué) ; DS mcc (CE) par 5 dont 2 réussis ; DS kanban (OI), examen « tout »
  // et une clé A1 : hors de a2/ce.
  a.forEach((id, i) => p(id, "a2/ce/ce2-choix/chx", i < 2 ? 1 : 0, i < 2 ? 100 : 50));
  a.slice(0, 7).forEach((id) => p(id, "a2/ce/ce2-asynchrone/asy", 0, 10));
  a.slice(0, 3).forEach((id) => p(id, "a2/ce/ce2-triphase/tri", 1, 100));
  a.slice(0, 5).forEach((id, i) => p(id, "a2/ds/ds-2026-11/mcc", i < 2 ? 1 : 0));
  a.slice(0, 6).forEach((id) => p(id, "a2/ds/ds-2026-11/kanban", 1));
  a.slice(0, 6).forEach((id) => p(id, "a2/ds/ds-2026-11/examen-tout", 1, 70));
  a.slice(0, 6).forEach((id) => p(id, "a1/ce/ce1-mcc/mcc", 1));
  // 2025 : de quoi compléter tri de 2026 (3 + 4 = 7) si on additionnait les promos
  d.forEach((id) => p(id, "a2/ce/ce2-triphase/tri", 1, 100));
  // le prof et le personnel ont essayé aussi : jamais comptés
  p(prof, "a2/ce/ce2-choix/chx", 1, 100);
  p(equipe, "a2/ce/ce2-choix/chx", 1, 100);
  p(equipe, "a2/ce/ce2-triphase/tri", 1, 100);
  p(equipe, "a2/ce/ce2-triphase/tri2", 1, 100);
  personnel.forEach((id) => p(id, "a2/ce/ce2-choix/chx", 1, 100));
  return { prof, eleve: a[0] };
}

test("statsClasse : agrégats SQL, tranches et seuil, sur les migrations", { skip: sansSqlite }, async () => {
  const { statsClasse } = await import("../src/prof-stats.js");
  const db = fausseD1();
  remplir(db);
  const r = await statsClasse(db, { annee: "a2", matiere: "ce", maintenant: MAINTENANT });
  assert.deepEqual(r.promos, [
    { promo: "2025", inscrits: null, actifs: null, eleves: null, cles: {} },
    {
      promo: "2026", inscrits: 30, actifs: 20, eleves: 30,
      cles: {
        "a2/ce/ce2-asynchrone/asy": { tentes: 7, reussite: { min: 0, max: 20 }, scoreMoyen: 10 },
        "a2/ce/ce2-choix/chx": { tentes: 30, reussite: { min: 0, max: 20 }, scoreMoyen: 53 },
        "a2/ds/ds-2026-11/mcc": { tentes: 5, reussite: { min: 40, max: 60 }, scoreMoyen: null },
      },
    },
    // promos sans aucune tentative : présentes quand même, celle de 4 sans aucun chiffre
    { promo: "2027", inscrits: 6, actifs: 5, eleves: null, cles: {} },
    { promo: "2028", inscrits: null, actifs: null, eleves: null, cles: {} },
  ]);
  assert.deepEqual(chiffresSousSeuil(r), []);
  assert.doesNotMatch(JSON.stringify(r), /responsable/);
  assert.doesNotMatch(JSON.stringify(r), /@|eleve[0-9]|prof\.ce|toulouse|agent/);

  // 0 réussi sur 7, 2 sur 30 : aucun nombre exact de réussis ni de ratés dans la réponse
  assert.doesNotMatch(JSON.stringify(r), /reussis|rates|echecs/);
  for (const p of r.promos) {
    for (const s of Object.values(p.cles)) assert.deepEqual(Object.keys(s).sort(), ["reussite", "scoreMoyen", "tentes"]);
  }
  for (const n of [2, 28, 3]) assert.ok(!nombres(r).includes(n), `${n} ne doit pas sortir`);  // réussis / ratés de chx et mcc

  // pas de total « toutes promos » : tri (3 en 2026 + 4 en 2025) n'apparaît nulle part
  assert.deepEqual(Object.keys(r).sort(), ["annee", "genereLe", "joursActifs", "largeurTranche", "matiere", "promos", "seuil"]);
  assert.ok(!("a2/ce/ce2-triphase/tri" in r.promos[1].cles));

  const oi = await statsClasse(db, { annee: "a2", matiere: "oi", maintenant: MAINTENANT });
  const oi2026 = oi.promos.find((p) => p.promo === "2026");
  assert.deepEqual(Object.keys(oi2026.cles), ["a2/ds/ds-2026-11/kanban"]);
  // OI : les 6 élèves du DS kanban ; l'examen « tout » et la clé A1 ne comptent pas
  assert.equal(oi2026.eleves, 6);
});

// ---------- page : chiffres d'un chapitre (public/prof-stats.js) ----------

test("chapitre : fourchette sur les seules clés non masquées", async () => {
  const { runInNewContext } = await import("node:vm");
  const fenetre = {};
  runInNewContext(readFileSync(new URL("../public/prof-stats.js", import.meta.url), "utf8"),
    { window: fenetre, document: { addEventListener() {} } });
  const bilan = (...a) => JSON.parse(JSON.stringify(fenetre.studicamTableauDeBord.bilan(...a)));
  // promo de 6 : a tentée par 6 (tranche 40-60), b masquée (tentée par 1 à 4 élèves, absente)
  const statsCles = {
    "a/1": { tentes: 6, reussite: { min: 40, max: 60 }, scoreMoyen: 50 },
    "c/1": { tentes: 10, reussite: { min: 0, max: 20 }, scoreMoyen: 10 },
    "d/1": { tentes: 30, reussite: { min: 60, max: 80 }, scoreMoyen: 70 },
  };
  const seule = bilan(["a/1"], statsCles, 6);
  assert.deepEqual(bilan(["a/1", "b/1"], statsCles, 6), seule);  // b n'entre dans aucune somme
  assert.deepEqual(seule, { tentesMax: 6, part: 1, reussite: { min: 40, max: 60 }, peuTravaille: false });
  assert.deepEqual(bilan(["b/1"], statsCles, 6), { tentesMax: null, part: null, reussite: null, peuTravaille: true });
  // deux exercices : bornes moyennées, pondérées par les tentés (10 × 0 + 30 × 60) / 40 = 45, etc.
  assert.deepEqual(bilan(["c/1", "d/1"], statsCles, 40).reussite, { min: 45, max: 65 });
  assert.ok(!JSON.stringify(seule).includes("reussis"));
});

// ---------- route complète : session, rôle, périmètre ----------

async function sha256Hex(texte) {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

async function ouvrir(db, utilisateurId) {
  const jeton = [...crypto.getRandomValues(new Uint8Array(32))].map((o) => o.toString(16).padStart(2, "0")).join("");
  db.base.prepare("INSERT INTO sessions (jeton_hash, utilisateur_id, expire_le, methode) VALUES (?, ?, ?, 'google')")
    .run(await sha256Hex(jeton), utilisateurId, new Date(Date.now() + 3600e3).toISOString());
  return jeton;
}

test("GET /api/prof/stats : contrôle d'accès côté serveur", { skip: sansSqlite }, async () => {
  const { apiProfStats } = await import("../src/prof-stats.js");
  const db = fausseD1();
  const { prof, eleve } = remplir(db);
  const env = { DB: db };
  db.base.prepare("INSERT INTO roles (email, role, perimetre) VALUES ('prof.ce@icam.fr', 'prof', 'a2/ce')").run();
  const jetonProf = await ouvrir(db, prof);
  const jetonEleve = await ouvrir(db, eleve);

  const appel = async (chemin, jeton, methode = "GET") => {
    const url = "https://studicam.pages.dev" + chemin;
    const headers = jeton ? { Cookie: "studicam_session=" + jeton } : {};
    try {
      return await apiProfStats(new Request(url, { method: methode, headers }), env, new URL(url).pathname);
    } catch (e) {
      if (e && e.statut) return { status: e.statut };
      throw e;
    }
  };

  assert.equal(await appel("/api/prof/autre", jetonProf), null);
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=ce", null)).status, 401);
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=ce", jetonEleve)).status, 403);
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=oi", jetonProf)).status, 403);
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=x'--", jetonProf)).status, 403);
  assert.equal((await appel("/api/prof/stats", jetonProf)).status, 403);
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=ce", jetonProf, "POST")).status, 405);

  const ok = await appel("/api/prof/stats?annee=a2&matiere=ce", jetonProf);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Cache-Control"), "no-store");
  const corps = await ok.json();
  assert.equal(corps.promos.find((p) => p.promo === "2026").cles["a2/ce/ce2-choix/chx"].tentes, 30);
  assert.doesNotMatch(JSON.stringify(corps), /@/);

  // par le Worker complet : garderProf puis MODULES_API
  const worker = (await import("../src/index.js")).default;
  const parWorker = (jeton, requete = "annee=a2&matiere=ce") => worker.fetch(new Request(
    "https://studicam.pages.dev/api/prof/stats?" + requete, { headers: { Cookie: "studicam_session=" + jeton } }), env);
  assert.equal((await parWorker(jetonProf)).status, 200);
  assert.equal((await parWorker(jetonProf, "annee=a2&matiere=oi")).status, 403);
  assert.equal((await parWorker(jetonEleve)).status, 403);

  // equipe voit toutes les matières
  db.base.prepare("UPDATE roles SET role = 'equipe', perimetre = '' WHERE email = 'prof.ce@icam.fr'").run();
  assert.equal((await appel("/api/prof/stats?annee=a2&matiere=oi", jetonProf)).status, 200);
});
