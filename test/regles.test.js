import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliserEmail, cleValide, validerProgression } from "../src/regles.js";

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
