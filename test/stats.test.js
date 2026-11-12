import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  SEUIL_ELEVES, promoDeDomaine, promoDeEmail, masquer, debutActivite, assemblerStats,
} from "../src/regles-stats.js";

// ---------- règles pures ----------

test("promo lue dans le domaine de l'adresse", () => {
  assert.equal(promoDeEmail("prenom.nom@2027.icam.fr"), "2027");
  assert.equal(promoDeEmail("x@A2-toulouse.ICAM.fr"), "a2-toulouse");
  assert.equal(promoDeDomaine("2028.icam.fr"), "2028");
  for (const email of [
    "prof@icam.fr", "x@a.b.icam.fr", "x@2027.icam.com", "x@2027.fauxicam.fr", "x@-a.icam.fr",
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

const MAINTENANT = Date.UTC(2026, 10, 12, 10);
const garderCe = (cle) => cle.startsWith("a2/ce/");

test("assemblage : petits groupes remplacés par null", () => {
  const r = assemblerStats({
    annee: "a2", matiere: "ce", maintenant: MAINTENANT, garderCle: garderCe,
    effectifs: [
      { domaine: "2027.icam.fr", inscrits: 12, actifs: 3 },
      { domaine: "2028.icam.fr", inscrits: 4, actifs: 4 },
      { domaine: "2029.icam.fr", inscrits: 40, actifs: 20 },   // aucun exercice de CE : absente
      { domaine: "icam.fr", inscrits: 9, actifs: 9 },          // profs : ignorés
    ],
    cles: [
      { domaine: "2027.icam.fr", cle: "a2/ce/x/a", tentes: 6, reussis: 2, score_moyen: 61.234, scores: 6 },
      { domaine: "2027.icam.fr", cle: "a2/ce/x/b", tentes: 4, reussis: 4, score_moyen: 90, scores: 4 },
      { domaine: "2027.icam.fr", cle: "a2/ce/x/c", tentes: 7, reussis: 0, score_moyen: 20, scores: 3 },
      { domaine: "2027.icam.fr", cle: "a2/oi/y/a", tentes: 9, reussis: 9, score_moyen: 100, scores: 9 },
      { domaine: "2028.icam.fr", cle: "a2/ce/x/a", tentes: 4, reussis: 1, score_moyen: 50, scores: 4 },
      { domaine: "icam.fr", cle: "a2/ce/x/a", tentes: 9, reussis: 9, score_moyen: 100, scores: 9 },
    ],
  });
  assert.equal(r.seuil, 5);
  assert.equal(r.genereLe, "2026-11-12T10:00:00.000Z");
  assert.deepEqual(r.promos, [
    {
      promo: "2027", inscrits: 12, actifs: null,
      cles: {
        "a2/ce/x/a": { tentes: 6, reussis: 2, scoreMoyen: 61.2 },
        "a2/ce/x/c": { tentes: 7, reussis: 0, scoreMoyen: null },
      },
    },
    { promo: "2028", inscrits: null, actifs: null, cles: {} },
  ]);
});

// Aucun chiffre de 1 à 4 ne doit sortir, où qu'il soit dans la réponse (réussis mis à part).
function chiffresSousSeuil(reponse) {
  const trouves = [];
  for (const p of reponse.promos) {
    for (const [nom, v] of [["inscrits", p.inscrits], ["actifs", p.actifs]]) {
      if (v !== null && v < SEUIL_ELEVES) trouves.push(`${p.promo} ${nom}=${v}`);
    }
    for (const [cle, s] of Object.entries(p.cles)) {
      if (!(s.tentes >= SEUIL_ELEVES)) trouves.push(`${p.promo} ${cle} tentes=${s.tentes}`);
    }
  }
  return trouves;
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

// Promo 2027 : 6 élèves (5 actifs) ; promo 2028 : 4 élèves ; un prof en @icam.fr.
function remplir(db) {
  const eleves = [];
  const ajouter = (email, vu) => {
    const r = db.base.prepare("INSERT INTO utilisateurs (email, cree_le, vu_le) VALUES (?, ?, ?)").run(email, IL_Y_A(60), vu);
    eleves.push(Number(r.lastInsertRowid));
    return Number(r.lastInsertRowid);
  };
  const a = [];
  for (let i = 0; i < 6; i++) a.push(ajouter(`eleve${i}@2027.icam.fr`, IL_Y_A(i < 5 ? 1 : 20)));
  const b = [];
  for (let i = 0; i < 4; i++) b.push(ajouter(`eleve${i}@2028.icam.fr`, IL_Y_A(1)));
  const prof = ajouter("prof.ce@icam.fr", IL_Y_A(0));
  const p = (id, cle, reussi, score = null) => db.base.prepare(
    "INSERT INTO progression (utilisateur_id, cle, reussi, score, maj_le) VALUES (?, ?, ?, ?, ?)"
  ).run(id, cle, reussi, score, IL_Y_A(2));

  // 2027 : dim tenté par 6 (4 réussis), tri tenté par 3, DS mcc (CE) par 5, DS kanban (OI) par 6
  [100, 100, 80, 100, 40, 20].forEach((s, i) => p(a[i], "a2/ce/ce2-dimensions/dim", s === 100 || s === 80 ? 1 : 0, s));
  [0, 1, 2].forEach((i) => p(a[i], "a2/ce/ce2-triphase/tri", 1, 100));
  [0, 1, 2, 3, 4].forEach((i) => p(a[i], "a2/ds/ds-2026-11/mcc", i < 2 ? 1 : 0));
  [0, 1, 2, 3, 4, 5].forEach((i) => p(a[i], "a2/ds/ds-2026-11/kanban", 1));
  [0, 1, 2, 3, 4, 5].forEach((i) => p(a[i], "a2/ds/ds-2026-11/examen-tout", 1, 70));
  [0, 1, 2, 3, 4, 5].forEach((i) => p(a[i], "a1/ce/ce1-mcc/mcc", 1));
  // 2028 : ses 4 élèves sur dim et tri (de quoi compléter 2027 si on additionnait les promos)
  b.forEach((id) => p(id, "a2/ce/ce2-dimensions/dim", 1, 100));
  b.forEach((id) => p(id, "a2/ce/ce2-triphase/tri", 1, 100));
  // le prof a essayé lui aussi : jamais compté
  p(prof, "a2/ce/ce2-dimensions/dim", 1, 100);
  return { prof, eleve: a[0] };
}

test("statsClasse : agrégats SQL et seuil, sur les migrations", { skip: sansSqlite }, async () => {
  const { statsClasse } = await import("../src/prof-stats.js");
  const db = fausseD1();
  remplir(db);
  const r = await statsClasse(db, { annee: "a2", matiere: "ce", maintenant: MAINTENANT });
  assert.deepEqual(r.promos, [
    {
      promo: "2027", inscrits: 6, actifs: 5,
      cles: {
        "a2/ce/ce2-dimensions/dim": { tentes: 6, reussis: 4, scoreMoyen: 73.3 },
        "a2/ds/ds-2026-11/mcc": { tentes: 5, reussis: 2, scoreMoyen: null },
      },
    },
    { promo: "2028", inscrits: null, actifs: null, cles: {} },
  ]);
  assert.deepEqual(chiffresSousSeuil(r), []);
  assert.doesNotMatch(JSON.stringify(r), /@|eleve|prof\.ce/);
  // pas de total « toutes promos » : la promo masquée (4 élèves) ne se retrouve par aucune
  // soustraction, et ses essais sur tri (3 + 4 = 7 toutes promos) n'apparaissent nulle part
  assert.deepEqual(Object.keys(r).sort(), ["annee", "genereLe", "joursActifs", "matiere", "promos", "seuil"]);
  assert.equal(r.promos[0].cles["a2/ce/ce2-dimensions/dim"].tentes, 6);
  assert.ok(!("a2/ce/ce2-triphase/tri" in r.promos[0].cles));

  const oi = await statsClasse(db, { annee: "a2", matiere: "oi", maintenant: MAINTENANT });
  assert.deepEqual(Object.keys(oi.promos[0].cles), ["a2/ds/ds-2026-11/kanban"]);
});

// ---------- page : chiffres d'un chapitre (public/prof-stats.js) ----------

test("chapitre : calculé sur les seules clés non masquées", async () => {
  const { runInNewContext } = await import("node:vm");
  const fenetre = {};
  runInNewContext(readFileSync(new URL("../public/prof-stats.js", import.meta.url), "utf8"),
    { window: fenetre, document: { addEventListener() {} } });
  const bilan = (...a) => JSON.parse(JSON.stringify(fenetre.studicamTableauDeBord.bilan(...a)));
  // promo de 6 : a tentée par 6 (3 réussis), b masquée (tentée par 1 à 4 élèves, absente)
  const statsCles = { "a/1": { tentes: 6, reussis: 3, scoreMoyen: 50 } };
  const seule = bilan(["a/1"], statsCles, 6);
  const avecMasquee = bilan(["a/1", "b/1"], statsCles, 6);
  assert.deepEqual(avecMasquee, seule);  // b n'entre dans aucune somme
  assert.deepEqual(seule, { tentesMax: 6, part: 1, reussite: 0.5, peuTravaille: false });
  assert.deepEqual(bilan(["b/1"], statsCles, 6), { tentesMax: null, part: null, reussite: null, peuTravaille: true });
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
  assert.equal(corps.promos[0].cles["a2/ce/ce2-dimensions/dim"].tentes, 6);
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
