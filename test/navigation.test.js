// Adresses par écran (public/navigation.js) : analyse, construction, routes ajoutées.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { lieuxDepuisIndex } from "../scripts/maj-lecons.mjs";

const contexte = {};
runInNewContext(readFileSync(new URL("../public/navigation.js", import.meta.url), "utf8"), contexte);
const { analyserAdresse, construireAdresse, slugChapitre, correspondMotif, memeAdresse, ONGLETS_FIXES_DS } = contexte.studicamAdresses;
const simple = (x) => JSON.parse(JSON.stringify(x));   // objets créés dans un autre contexte vm

test("analyse des adresses du site", () => {
  const cas = {
    "": { ecran: "accueil" },
    "#": { ecran: "accueil" },
    "#/": { ecran: "accueil" },
    "#/a2": { ecran: "annee", annee: "a2" },
    "#/A1/": { ecran: "annee", annee: "a1" },
    "#/a2/techniques": { ecran: "domaine", annee: "a2", domaine: "techniques" },
    "#/a1/sciences": { ecran: "domaine", annee: "a1", domaine: "sciences" },
    "#/a2/ce": { ecran: "matiere", annee: "a2", matiere: "ce" },
    "#/a2/ce/asynchrone": { ecran: "lecon", annee: "a2", matiere: "ce", chapitre: "asynchrone" },
    "#/a2/ce/asynchrone/lecon": { ecran: "lecon", annee: "a2", matiere: "ce", chapitre: "asynchrone" },
    "#/a2/ce/asynchrone/lecon/3": { ecran: "lecon", annee: "a2", matiere: "ce", chapitre: "asynchrone", partie: 3 },
    "#/a2/ce/asynchrone/exo/ce2-asynchrone": { ecran: "exo", annee: "a2", matiere: "ce", chapitre: "asynchrone", exo: "ce2-asynchrone" },
    "#/a2/cm/vecteurs/exo/exo1": { ecran: "exo", annee: "a2", matiere: "cm", chapitre: "vecteurs", exo: "exo1" },
    "#/a2/revision-ds": { ecran: "revision-ds", annee: "a2" },
    "#/a2/revision-ds/ds-2026-11": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11" },
    "#/a2/revision-ds/ds-2026-11/examen": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "examen" },
    "#/a2/revision-ds/ds-2026-11/ce/mas": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "ce", chap: "mas" },
    "#/a2/revision-ds/ds-2026-11-phys/phys/ondes": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11-phys", onglet: "phys", chap: "ondes" },
    // anciennes adresses, sans id : le DS du 14/11/2026
    "#/a2/revision-ds/examen": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "examen" },
    "#/a2/revision-ds/ce/mas": { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "ce", chap: "mas" },
    "#/prof": { ecran: "prof" },
    "#/serie": { ecran: "serie" },
    "#/prof/signalements": { ecran: "prof", section: "signalements" },
    "#/lecon/oi-msp": { ecran: "lecon", lecon: "oi-msp" },
    "#/exo/aii-codes": { ecran: "exo", exo: "aii-codes" },
    "#/a2/ce/asyn%63hrone/lecon": { ecran: "lecon", annee: "a2", matiere: "ce", chapitre: "asynchrone" },
  };
  for (const [adresse, attendu] of Object.entries(cas)) {
    assert.deepEqual(simple(analyserAdresse(adresse)), attendu, adresse);
  }
});

test("adresses refusées (retour à l'accueil)", () => {
  for (const adresse of [
    "#section", "#a2", "#/a3", "#/a2/x1", "#/a2/ce/asynchrone/autre", "#/a2/ce/asynchrone/lecon/0",
    "#/a2/ce/asynchrone/lecon/x", "#/a2/ce/asynchrone/lecon/100", "#/a2/ce/asynchrone/exo",
    "#/a2/ce/a/b/c/d", "#/a2/techniques/plus", "#/a2/revision-ds/In-connu", "#/a2/revision-ds/examen/mas",
    "#/a2/revision-ds/ce/mas/plus", "#/a2/revision-ds/ds-2026-11/dsblanc/x", "#/a2/revision-ds/ds-2026-11/ce/mas/plus", "#/prof/a/b", "#/serie/x", "#/a2/<script>", "#/a2/ce/%3Cimg%3E/lecon",
    "#/a2/ce/%E0%A4%A/lecon", "#/a2/ce/" + "x".repeat(81), "#/a2//ce", "#/..", "#/a2/ce/-x/lecon",
    "javascript:alert(1)", null,
  ]) {
    const r = analyserAdresse(adresse);
    assert.ok(r === null || (adresse === null && r.ecran === "accueil"), String(adresse));
  }
});

test("construction puis analyse : même écran", () => {
  const ecrans = [
    { ecran: "accueil" },
    { ecran: "annee", annee: "a1" },
    { ecran: "domaine", annee: "a2", domaine: "sciences" },
    { ecran: "matiere", annee: "a2", matiere: "oi" },
    { ecran: "lecon", annee: "a2", matiere: "oi", chapitre: "msp" },
    { ecran: "lecon", annee: "a2", matiere: "oi", chapitre: "msp", partie: 12 },
    { ecran: "exo", annee: "a1", matiere: "aii", chapitre: "combinatoire", exo: "aii-karnaugh" },
    { ecran: "revision-ds", annee: "a2" },
    { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11" },
    { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "formules" },
    { ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "expo", chap: "smed" },
    { ecran: "prof" },
    { ecran: "prof", section: "tableau-de-bord" },
    { ecran: "serie" },
    { ecran: "lecon", lecon: "ph1-ali" },
    { ecran: "exo", exo: "m1x-suites" },
  ];
  for (const r of ecrans) {
    const adresse = construireAdresse(r);
    assert.match(adresse, /^#\//);
    assert.deepEqual(simple(analyserAdresse(adresse)), r, adresse);
  }
  assert.equal(construireAdresse({ ecran: "accueil" }), "#/");
  assert.equal(construireAdresse({ ecran: "lecon", annee: "a2", matiere: "ce", chapitre: "asynchrone" }), "#/a2/ce/asynchrone/lecon");
  assert.equal(construireAdresse({ ecran: "exo", annee: "a2", matiere: "ce", chapitre: "asynchrone", exo: "ce2-asynchrone" }), "#/a2/ce/asynchrone/exo/ce2-asynchrone");
  assert.equal(construireAdresse({ ecran: "revision-ds", annee: "a2", ds: "ds-2026-11", onglet: "examen", chap: "mas" }), "#/a2/revision-ds/ds-2026-11/examen");
  assert.equal(construireAdresse(null), "#/");
  assert.equal(construireAdresse({ ecran: "inconnu" }), "#/");
});

test("segment de chapitre : leçon sans préfixe, unique dans chaque matière", () => {
  assert.equal(slugChapitre({ lecon: "ce2-asynchrone" }), "asynchrone");
  assert.equal(slugChapitre({ lecon: "oi-msp" }), "msp");
  assert.equal(slugChapitre({ lecon: "m1-edo" }), "edo");
  assert.equal(slugChapitre({ interactif: true }), "vecteurs");
  assert.equal(slugChapitre({ interactifA1: true }), "liaisons");
  assert.equal(slugChapitre({ titre: "en cours de rédaction" }), null);

  const lieux = lieuxDepuisIndex(readFileSync(new URL("../public/index.html", import.meta.url), "utf8"));
  const parMatiere = {};
  for (const [lecon, paires] of Object.entries(lieux)) {
    for (const paire of paires) {
      const slug = slugChapitre({ lecon });
      const [annee, matiere] = paire.split("/");
      const adresse = construireAdresse({ ecran: "lecon", annee, matiere, chapitre: slug });
      assert.equal(analyserAdresse(adresse)?.chapitre, slug, adresse);
      (parMatiere[paire] ||= new Set());
      assert.ok(!parMatiere[paire].has(slug), `deux chapitres « ${slug} » en ${paire}`);
      parMatiere[paire].add(slug);
    }
  }
  assert.ok(Object.keys(parMatiere).length >= 10);
});

test("onglets fixes de la Révision DS : les mêmes que revision-ds.js", () => {
  const source = readFileSync(new URL("../public/revision-ds.js", import.meta.url), "utf8");
  for (const cle of Object.keys(ONGLETS_FIXES_DS)) assert.ok(source.includes(`['${cle}', '`), cle);
  assert.deepEqual(Object.keys(ONGLETS_FIXES_DS), ["examen", "formules", "dsblanc"]);
});

test("routes ajoutées (contrat studicamRoutes.ajouter)", () => {
  assert.deepEqual(simple(correspondMotif("#/progression", "#/progression")), {});
  assert.deepEqual(simple(correspondMotif("/progression", "#/progression/")), {});
  assert.deepEqual(simple(correspondMotif("progression/:onglet", "#/progression/erreurs")), { onglet: "erreurs" });
  assert.equal(correspondMotif("#/progression", "#/progression/erreurs"), null);
  assert.equal(correspondMotif("#/progression", "#/a2"), null);
  assert.equal(correspondMotif("#/progression/:x", "#/progression/<b>"), null);
  assert.deepEqual(simple(correspondMotif(/^\/carnet\/(?<page>\d+)$/, "#/carnet/2")).page, "2");
  assert.equal(correspondMotif(/^\/carnet$/, "#/a2"), null);
  assert.ok(memeAdresse("", "#/"));
  assert.ok(memeAdresse("#", "#/"));
  assert.ok(!memeAdresse("#/a2", "#/a1"));
});
