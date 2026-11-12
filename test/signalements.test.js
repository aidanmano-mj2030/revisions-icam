import { test } from "node:test";
import assert from "node:assert/strict";
import {
  identifiantValide, nettoyerMessage, validerSignalement, validerRelecture, validerTraitement,
  lireFiltreStatut, nomAffichable, debutFenetre, MESSAGE_MAX,
} from "../src/regles-signalements.js";

test("identifiants de leçon et d'exercice", () => {
  for (const id of ["aii-grafcet", "maths-dl-usuels", "m1-edo", "oi2-veille", "a", "a".repeat(60)]) {
    assert.ok(identifiantValide(id), id);
  }
  for (const id of ["", "-aii", "aii-", "aii--x", "Aii", "aii_x", "aii/x", "a b", "é", "a".repeat(61), null, 3, {}]) {
    assert.equal(identifiantValide(id), false, String(id));
  }
});

test("message nettoyé", () => {
  assert.equal(nettoyerMessage("  Erreur de signe\r\nligne 2 \u0000"), "Erreur de signe\nligne 2");
  assert.equal(nettoyerMessage("a\u2028b\tc"), "ab\tc");
  assert.equal(nettoyerMessage("é".repeat(MESSAGE_MAX)), "é".repeat(MESSAGE_MAX));
  assert.equal(nettoyerMessage("😀".repeat(MESSAGE_MAX)).length, 2 * MESSAGE_MAX);  // compté en caractères
  for (const m of ["", "   \n\t ", "\u0000", "a".repeat(MESSAGE_MAX + 1), null, 42, ["a"]]) {
    assert.equal(nettoyerMessage(m), null, String(m));
  }
});

test("signalement valide", () => {
  const base = { annee: "a2", matiere: "ce", lecon: "ce2-triphase", message: " Coquille " };
  assert.deepEqual(validerSignalement(base), { annee: "a2", matiere: "ce", lecon: "ce2-triphase", cle_exo: null, message: "Coquille" });
  assert.equal(validerSignalement({ ...base, cle_exo: "ce2-triphase" }).cle_exo, "ce2-triphase");
  assert.equal(validerSignalement({ ...base, cle_exo: null }).cle_exo, null);
  assert.equal(validerSignalement({ ...base, cle_exo: "" }).cle_exo, null);
});

test("signalements refusés", () => {
  const base = { annee: "a2", matiere: "ce", lecon: "ce2-triphase", message: "x" };
  for (const corps of [
    null, [], "x", {},
    { ...base, annee: "a3" }, { ...base, annee: "A2" }, { ...base, matiere: "ds" }, { ...base, matiere: "CE" },
    { ...base, lecon: "../x" }, { ...base, lecon: undefined }, { ...base, cle_exo: "a b" }, { ...base, cle_exo: 3 },
    { ...base, message: "" }, { ...base, message: "a".repeat(MESSAGE_MAX + 1) }, { ...base, message: { t: "x" } },
  ]) {
    assert.equal(validerSignalement(corps), null, JSON.stringify(corps));
  }
});

test("relecture", () => {
  assert.deepEqual(validerRelecture({ lecon: "oi-msp", annee: "a2", matiere: "oi", autre: 1 }), { lecon: "oi-msp", annee: "a2", matiere: "oi" });
  assert.equal(validerRelecture({ lecon: "oi-msp", annee: "a2" }), null);
  assert.equal(validerRelecture({ lecon: "OI", annee: "a2", matiere: "oi" }), null);
  assert.equal(validerRelecture(null), null);
});

test("traitement d'un signalement", () => {
  assert.deepEqual(validerTraitement({ id: 4, statut: "corrige" }), { id: 4, statut: "corrige" });
  assert.deepEqual(validerTraitement({ id: 4, statut: "ouvert" }), { id: 4, statut: "ouvert" });
  for (const corps of [{ id: 0, statut: "rejete" }, { id: "4", statut: "rejete" }, { id: 1.5, statut: "rejete" },
    { id: 4, statut: "supprime" }, { id: 4 }, [], null]) {
    assert.equal(validerTraitement(corps), null, JSON.stringify(corps));
  }
});

test("filtre de statut", () => {
  assert.equal(lireFiltreStatut(null), "ouvert");
  assert.equal(lireFiltreStatut(""), "ouvert");
  assert.equal(lireFiltreStatut("rejete"), "rejete");
  assert.equal(lireFiltreStatut("tous"), null);
  assert.equal(lireFiltreStatut("autre"), undefined);
});

test("nom affiché à la place de l'adresse", () => {
  assert.equal(nomAffichable("jean-pierre.dupont@icam.fr"), "Jean-Pierre Dupont");
  assert.equal(nomAffichable("marie.durand2@icam.fr"), "Marie Durand");
  assert.equal(nomAffichable("Paul_Martin@icam.fr"), "Paul Martin");
  assert.equal(nomAffichable("dupont@icam.fr"), "Dupont");
  assert.equal(nomAffichable("1234@icam.fr"), "Un prof");
  assert.equal(nomAffichable(null), "Un prof");
  assert.ok(!nomAffichable("a.b@icam.fr").includes("@"));
});

test("fenêtre de 24 heures", () => {
  assert.equal(debutFenetre(Date.UTC(2026, 10, 12, 10)), "2026-11-11T10:00:00.000Z");
});
