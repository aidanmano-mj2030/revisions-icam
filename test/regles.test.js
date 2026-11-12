import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normaliserEmail, cleValide, validerProgression, lirePerimetre, dansPerimetre, matiereDeCle,
} from "../src/regles.js";

test("adresses acceptées et normalisées", () => {
  assert.equal(normaliserEmail("prenom.nom@icam.fr"), "prenom.nom@icam.fr");
  assert.equal(normaliserEmail("x@etudiant.icam.fr"), "x@etudiant.icam.fr");
  assert.equal(normaliserEmail("  Prenom.Nom@ICAM.FR "), "prenom.nom@icam.fr");
  assert.equal(normaliserEmail("a@b.c.icam.fr"), "a@b.c.icam.fr");
});

test("adresses refusées", () => {
  for (const email of [
    "x@fauxicam.fr", "x@icam.fr.evil.com", "x@icam.com", "pre nom@icam.fr",
    "a@b@icam.fr", "@icam.fr", "x@.icam.fr", "x@-a.icam.fr", "x@icam.fr.",
    "", "   ", null, undefined, 42, {}, "x@sub_domaine.icam.fr",
    "a".repeat(250) + "@icam.fr",
  ]) {
    assert.equal(normaliserEmail(email), null, String(email));
  }
});

test("clés de progression", () => {
  assert.ok(cleValide("maths/chapitre-1/ex_2.3"));
  assert.ok(cleValide("a"));
  assert.ok(cleValide("a".repeat(120)));
  for (const cle of ["", "a".repeat(121), "Maths", "a b", "a?b", "é", 3, null]) {
    assert.equal(cleValide(cle), false, String(cle));
  }
});

test("corps de progression", () => {
  assert.deepEqual(validerProgression({ cle: "a", reussi: true }), { cle: "a", reussi: true, score: null });
  assert.deepEqual(validerProgression({ cle: "a", reussi: false, score: 55.5 }), { cle: "a", reussi: false, score: 55.5 });
  assert.equal(validerProgression({ cle: "a", reussi: "true" }), null);
  assert.equal(validerProgression({ cle: "a", reussi: true, score: 101 }), null);
  assert.equal(validerProgression({ cle: "a", reussi: true, score: -1 }), null);
  assert.equal(validerProgression({ cle: "a", reussi: true, score: "50" }), null);
  assert.equal(validerProgression([]), null);
  assert.equal(validerProgression(null), null);
});

// ---------- accès prof ----------

test("lecture du périmètre", () => {
  assert.deepEqual(lirePerimetre("a2/ce"), ["a2/ce"]);
  assert.deepEqual(lirePerimetre(" A2/CE , a2/oi,a1/maths "), ["a2/ce", "a2/oi", "a1/maths"]);
  assert.deepEqual(lirePerimetre("a2/ce,a2/ce"), ["a2/ce"]);
  assert.deepEqual(lirePerimetre("a3/ce,a2/info,a2,ce,a2/ce/x,/ce,a2/,,a2/oi"), ["a2/oi"]);
  for (const vide of ["", "   ", null, undefined, 42, ["a2/ce"]]) assert.deepEqual(lirePerimetre(vide), [], String(vide));
});

test("périmètre d'un prof", () => {
  const p = lirePerimetre("a2/ce,a1/oi");
  assert.equal(dansPerimetre("prof", p, "a2", "ce"), true);
  assert.equal(dansPerimetre("prof", p, "a1", "oi"), true);
  assert.equal(dansPerimetre("prof", "a2/ce", "a2", "ce"), true);   // texte brut accepté
  assert.equal(dansPerimetre("prof", p, "a1", "ce"), false);
  assert.equal(dansPerimetre("prof", p, "a2", "oi"), false);
  assert.equal(dansPerimetre("prof", [], "a2", "ce"), false);
  assert.equal(dansPerimetre("prof", p, "A2", "CE"), false);        // les routes passent des minuscules
});

test("rôle equipe et rôles inconnus", () => {
  assert.equal(dansPerimetre("equipe", [], "a1", "eco"), true);
  assert.equal(dansPerimetre("equipe", "", "a2", "maths"), true);
  assert.equal(dansPerimetre("equipe", [], "a3", "ce"), false);     // paire inconnue : refusée pour tous
  assert.equal(dansPerimetre("equipe", [], "a2", undefined), false);
  for (const role of [null, undefined, "", "eleve", "admin", "Prof", "EQUIPE"]) {
    assert.equal(dansPerimetre(role, ["a2/ce"], "a2", "ce"), false, String(role));
  }
});

test("matière d'une clé de progression", () => {
  assert.deepEqual(matiereDeCle("a2/cm/produit-scalaire/exo1"), { annee: "a2", matiere: "cm" });
  assert.deepEqual(matiereDeCle("a1/aii/aii-karnaugh/kn"), { annee: "a1", matiere: "aii" });
  assert.deepEqual(matiereDeCle("a1/maths/m1-calculs/m1x-m1-calculs"), { annee: "a1", matiere: "maths" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/mas"), { annee: "a2", matiere: "ce" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/kanban"), { annee: "a2", matiere: "oi" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/vsm"), { annee: "a2", matiere: "oi" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/examen-ce"), { annee: "a2", matiere: "ce" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/examen-expo"), { annee: "a2", matiere: "oi" });
  assert.deepEqual(matiereDeCle("a2/ds/ds-2026-11/examen-cours"), { annee: "a2", matiere: "oi" });
  for (const cle of [
    "a2/ds/ds-2026-11/examen-tout", "a2/ds/ds-2026-11/examen-", "a2/ds/ds-2026-11/inconnu",
    "a2/ds/ds-2026-11", "a2/ds/ds-2027-01/mas", "a1/ds/ds-2026-11/mas", "a2/ds/ds-2026-11/mas/x",
    "a2/ds/ds-2026-11/hasownproperty", "a2/ds/constructor/mas",
    "ax/autre/exo/bloc", "a3/ce/x/y", "a2/info/x/y", "a2/ce", "a2", "", "A2/CE/x/y", null, 3,
  ]) {
    assert.equal(matiereDeCle(cle), null, String(cle));
  }
});

// Garde-fou : chaque chapitre de public/revision-ds.js est rattaché à la bonne matière.
test("chapitres de la Révision DS rattachés à CE ou OI", () => {
  const source = readFileSync(new URL("../public/revision-ds.js", import.meta.url), "utf8");
  const section = (debut, fin) => {
    const morceau = source.slice(source.indexOf(debut), fin ? source.indexOf(fin) : undefined);
    return [...morceau.matchAll(/^\s+id: '([a-z0-9-]+)', code: /gm)].map((m) => m[1]);
  };
  const ds = source.match(/const DS = \{ id: '([a-z0-9-]+)'/)[1];
  const oi = [...section("const EXPOSES = [", "const COURS_OI = ["), ...section("const COURS_OI = [", "const CE = [")];
  const ce = section("const CE = [", "const DSB =");
  assert.ok(oi.length >= 10 && ce.length >= 5, `chapitres lus : ${oi.length} OI, ${ce.length} CE`);
  for (const id of ce) assert.deepEqual(matiereDeCle(`a2/ds/${ds}/${id}`), { annee: "a2", matiere: "ce" }, id);
  for (const id of oi) assert.deepEqual(matiereDeCle(`a2/ds/${ds}/${id}`), { annee: "a2", matiere: "oi" }, id);
});
