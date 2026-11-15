// Calculs de public/serie.js (séries de QCM) : hash FNV-1a des identifiants de question, note sur
// 20 arrondie au demi-point, pourcentage, durée et résultats d'une série. Le fichier est un script
// de navigateur : on l'exécute dans un contexte vm avec un window réduit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../public/serie.js", import.meta.url), "utf8");
const window = {};
vm.runInNewContext(code, { window, TextEncoder, console });
const S = window.StudicamSerie;

test("FNV-1a 32 bits : valeurs de référence", () => {
  assert.equal(S.fnv1a(""), "811c9dc5");
  assert.equal(S.fnv1a("a"), "e40c292c");
  assert.equal(S.fnv1a("foobar"), "bf9cf968");
  assert.match(S.fnv1a("Quel est le principe central du SMED ?"), /^[0-9a-f]{8}$/);
});

test("FNV-1a sur les octets UTF-8", () => {
  // calcul direct sur les octets, pour vérifier que le texte n'est pas pris en UTF-16
  const ref = (t) => {
    let h = 0x811c9dc5;
    for (const o of Buffer.from(t, "utf8")) { h ^= o; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  };
  for (const t of ["é", "Énergie : $P = UI$", "≤ 0,07 mm", "😀", "Le triangle « I »"]) assert.equal(S.fnv1a(t), ref(t), t);
  assert.notEqual(S.fnv1a("é"), S.fnv1a("e"));
});

test("identifiant stable d'une question", () => {
  assert.equal(window.studicamIdQuestion("exo/oi2-veille", "a"), "exo/oi2-veille#e40c292c");
  assert.equal(window.studicamIdQuestion("rds/ce/mas", ""), "rds/ce/mas#811c9dc5");
  const id = window.studicamIdQuestion("rds/expo/smed", "Quel est le principe central du SMED ?");
  assert.equal(id, window.studicamIdQuestion("rds/expo/smed", "Quel est le principe central du SMED ?"));
  assert.match(id, /^rds\/expo\/smed#[0-9a-f]{8}$/);
});

test("note sur 20 arrondie au demi-point", () => {
  assert.equal(S.noteSur20(29, 40), 14.5);      // 14,5 tout rond
  assert.equal(S.noteSur20(20, 27), 15);        // 14,81 → 15
  assert.equal(S.noteSur20(19, 27), 14);        // 14,07 → 14
  assert.equal(S.noteSur20(13, 18), 14.5);      // 14,44 → 14,5
  assert.equal(S.noteSur20(1, 3), 6.5);         // 6,67 → 6,5
  assert.equal(S.noteSur20(2, 3), 13.5);        // 13,33 → 13,5
  assert.equal(S.noteSur20(0, 82), 0);
  assert.equal(S.noteSur20(82, 82), 20);
  assert.equal(S.noteSur20(0, 0), 0);           // série vide : pas de division par zéro
  for (let t = 1; t <= 90; t++) for (let j = 0; j <= t; j++) {
    const n = S.noteSur20(j, t);
    assert.equal(n * 2, Math.round(n * 2), `${j}/${t}`);
    assert.ok(Math.abs(n - 20 * j / t) <= 0.25 + 1e-9, `${j}/${t}`);
  }
});

test("pourcentage et texte de la note", () => {
  assert.equal(S.pourcentage(29, 40), 73);      // 72,5 → 73
  assert.equal(S.pourcentage(1, 3), 33);
  assert.equal(S.pourcentage(0, 0), 0);
  assert.equal(S.texteNote(29, 40), "14,5 / 20 (73 %)");
  assert.equal(S.texteNote(40, 40), "20 / 20 (100 %)");
  assert.equal(S.texteNote(0, 12), "0 / 20 (0 %)");
});

test("durée lisible", () => {
  assert.equal(S.texteDuree(0), "0 s");
  assert.equal(S.texteDuree(45.4), "45 s");
  assert.equal(S.texteDuree(65), "1 min 05 s");
  assert.equal(S.texteDuree(3725), "1 h 02 min");
  assert.equal(S.texteDuree(-3), "0 s");
});

test("résultats d'une série : sans réponse = faux, plusieurs bonnes réponses", () => {
  const qs = [
    { id: "a", ok: [1], chapitre: "CE · Moteur asynchrone" },
    { id: "b", ok: [0, 2], chapitre: "CE · Moteur asynchrone" },
    { id: "c", ok: [3], chapitre: "OI · SMED" },
    { id: "d", ok: [0], chapitre: "OI · SMED" },
  ];
  const r = S.resultats(qs, { a: [1], b: [2, 0], c: [2] });
  assert.equal(r.total, 4);
  assert.equal(r.justes, 2);
  assert.equal(r.note20, 10);
  assert.equal(r.pourcent, 50);
  assert.deepEqual(JSON.parse(JSON.stringify(r.lignes)), [
    { id: "a", chapitre: "CE · Moteur asynchrone", juste: true, repondue: true },
    { id: "b", chapitre: "CE · Moteur asynchrone", juste: true, repondue: true },
    { id: "c", chapitre: "OI · SMED", juste: false, repondue: true },
    { id: "d", chapitre: "OI · SMED", juste: false, repondue: false },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.parChapitre)), [
    { chapitre: "CE · Moteur asynchrone", justes: 2, total: 2 },
    { chapitre: "OI · SMED", justes: 0, total: 2 },
  ]);
  // une seule des deux bonnes réponses cochées, ou une de trop : faux
  assert.equal(S.memeChoix([0, 2], [0]), false);
  assert.equal(S.memeChoix([0, 2], [0, 1, 2]), false);
  assert.equal(S.memeChoix([1], undefined), false);
});

test("questions retrouvées par identifiant", () => {
  window.studicamSourcesQcm.push(["test", () => [
    { id: "test#1", q: "Énoncé", opts: ["A", "B"], ok: [1], expl: "Parce que.", chapitre: "Test · Un" },
  ]]);
  assert.deepEqual(JSON.parse(JSON.stringify(window.studicamQuestionParId("test#1"))), { q: "Énoncé", opts: ["A", "B"], ok: [1], expl: "Parce que.", chapitre: "Test · Un" });
  assert.equal(window.studicamQuestionParId("test#2"), null);
  // une question avec un schéma le garde
  window.studicamSourcesQcm.push(["test-fig", () => [
    { id: "test#fig", q: "Avec schéma", fig: "<svg></svg>", opts: ["A", "B"], ok: [0], expl: "", chapitre: "Test · Deux" },
  ]]);
  assert.equal(window.studicamQuestionParId("test#fig").fig, "<svg></svg>");
  // une copie : modifier le résultat ne change pas la question
  window.studicamQuestionParId("test#1").ok.push(0);
  assert.deepEqual([...window.studicamQuestionParId("test#1").ok], [1]);
});
