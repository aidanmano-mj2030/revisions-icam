import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ANNEES, MATIERES } from "../src/regles.js";
import {
  dateDuJour, dateValide, ajouterJours, promoDeEmail, normaliserTexte, lireChapitres,
  chapitresDepuisTexte, validerAnnonce, annonceVisible, lireId, TEXTE_MAX, CHAPITRES_MAX,
  chapitreDeLaMatiere, nomAffichable,
} from "../src/regles-annonces.js";

const AUJOURDHUI = "2026-11-12";
const base = {
  annee: "a2", matiere: "ce", texte: "DS jeudi : revoir le triphasé.",
  chapitres: ["ce2-triphase", "ce2-magneto"], debut: "2026-11-12", fin: "2026-11-14",
};

test("date du jour à l'heure de Paris", () => {
  assert.equal(dateDuJour(Date.UTC(2026, 10, 12, 10)), "2026-11-12");
  // 23 h 30 UTC le 12 novembre = 0 h 30 le 13 à Paris (UTC+1)
  assert.equal(dateDuJour(Date.UTC(2026, 10, 12, 23, 30)), "2026-11-13");
  // été : UTC+2
  assert.equal(dateDuJour(Date.UTC(2026, 6, 1, 22, 30)), "2026-07-02");
});

test("dates du calendrier", () => {
  for (const d of ["2026-11-12", "2028-02-29", "2026-12-31"]) assert.ok(dateValide(d), d);
  for (const d of ["2026-02-30", "2027-02-29", "2026-13-01", "2026-1-01", "12/11/2026", "2026-11-12T00:00", "", null, 20261112]) {
    assert.equal(dateValide(d), false, String(d));
  }
  assert.equal(ajouterJours("2026-12-30", 3), "2027-01-02");
  assert.equal(ajouterJours("2026-03-28", 2), "2026-03-30");
});

test("promo déduite de l'adresse", () => {
  assert.equal(promoDeEmail("prenom.nom@2030.icam.fr"), "2030");
  assert.equal(promoDeEmail(" Prenom.Nom@2031.ICAM.FR "), "2031");
  for (const e of ["prof@icam.fr", "x@etudiant.icam.fr", "x@a.2030.icam.fr", "x@2030.icam.fr.evil.com", "x@20300.icam.fr", null]) {
    assert.equal(promoDeEmail(e), null, String(e));
  }
});

test("texte simple normalisé", () => {
  assert.equal(normaliserTexte("  DS jeudi  "), "DS jeudi");
  assert.equal(normaliserTexte("a\r\nb\rc"), "a\nb\nc");
  assert.equal(normaliserTexte("a\n\n\n\nb"), "a\n\nb");
  assert.equal(normaliserTexte("a\tb"), "a b");
  assert.equal(normaliserTexte("<b>pas de HTML interprété</b>"), "<b>pas de HTML interprété</b>");
  assert.equal(normaliserTexte("é".repeat(TEXTE_MAX)), "é".repeat(TEXTE_MAX));
  assert.equal(normaliserTexte("😀".repeat(TEXTE_MAX)), "😀".repeat(TEXTE_MAX));  // compté en caractères
  for (const t of ["", "   ", "\n\n", "a".repeat(TEXTE_MAX + 1), "a\u0000b", "a\u0007b", "a\u202eb", "a\u2028b", 42, null]) {
    assert.equal(normaliserTexte(t), null, JSON.stringify(t));
  }
});

test("chapitres", () => {
  assert.deepEqual(lireChapitres(undefined), []);
  assert.deepEqual(lireChapitres(null), []);
  assert.deepEqual(lireChapitres(["m1-trigo", "m1-edo", "m1-trigo"]), ["m1-trigo", "m1-edo"]);
  assert.deepEqual(lireChapitres(["a"]), ["a"]);
  for (const c of ["m1-trigo", [""], ["M1-TRIGO"], ["a,b"], ["-a"], ["a-"], ["a".repeat(61)], [3],
    Array.from({ length: CHAPITRES_MAX + 1 }, (_, i) => "c" + i)]) {
    assert.equal(lireChapitres(c), null, JSON.stringify(c));
  }
  assert.deepEqual(chapitresDepuisTexte("ce2-triphase,ce2-magneto"), ["ce2-triphase", "ce2-magneto"]);
  assert.deepEqual(chapitresDepuisTexte(""), []);
  assert.deepEqual(chapitresDepuisTexte("ok,<x>,"), ["ok"]);
});

test("annonce valide", () => {
  assert.deepEqual(validerAnnonce(base, AUJOURDHUI), {
    annonce: { ...base, promo: null },
  });
  const r = validerAnnonce({ ...base, promo: " 2030 ", chapitres: undefined, debut: "2026-11-20", fin: "2026-11-20", inconnu: 1 }, AUJOURDHUI);
  assert.deepEqual(r.annonce, { annee: "a2", matiere: "ce", promo: "2030", texte: base.texte, chapitres: [], debut: "2026-11-20", fin: "2026-11-20" });
  assert.equal(validerAnnonce({ ...base, promo: "" }, AUJOURDHUI).annonce.promo, null);
  // commencée hier, finit aujourd'hui : acceptée
  assert.ok(validerAnnonce({ ...base, debut: "2026-11-11", fin: "2026-11-12" }, AUJOURDHUI).annonce);
  // durée maximale tout juste
  assert.ok(validerAnnonce({ ...base, debut: "2026-11-12", fin: ajouterJours("2026-11-12", 120) }, AUJOURDHUI).annonce);
});

test("annonces refusées", () => {
  const cas = [
    null, [], "x",
    { ...base, annee: "a3" }, { ...base, annee: "A2" },
    { ...base, matiere: "CE" }, { ...base, matiere: "c e" }, { ...base, matiere: "" }, { ...base, matiere: 3 },
    { ...base, promo: "30" }, { ...base, promo: "2030a" }, { ...base, promo: 2030 },
    { ...base, texte: "" }, { ...base, texte: "a".repeat(501) },
    { ...base, matiere: "latin" }, { ...base, matiere: "constructor" },
    { ...base, chapitres: "ce2-triphase" }, { ...base, chapitres: ["<script>"] },
    { ...base, chapitres: ["ce2-triphase", "ce1-mcc"] },                // CE de 1ère année
    { ...base, chapitres: ["oi2-gps"] },                                // autre matière
    { ...base, chapitres: ["ce2-"] },                                   // préfixe seul
    { ...base, debut: "2026-11-31" }, { ...base, fin: undefined },
    { ...base, debut: "2026-11-14", fin: "2026-11-13" },                  // fin avant début
    { ...base, debut: "2026-11-01", fin: "2026-11-11" },                  // déjà terminée
    { ...base, debut: "2027-11-13", fin: "2027-11-14" },                  // plus d'un an d'avance
    { ...base, debut: "2026-11-12", fin: ajouterJours("2026-11-12", 121) }, // trop longue
  ];
  for (const corps of cas) {
    const r = validerAnnonce(corps, AUJOURDHUI);
    assert.ok(r.erreur && !r.annonce, JSON.stringify(corps));
  }
});

test("visibilité côté élève", () => {
  const a = { debut: "2026-11-10", fin: "2026-11-14", promo: null };
  assert.ok(annonceVisible(a, "2026-11-10", "2030"));
  assert.ok(annonceVisible(a, "2026-11-14", "2030"));      // fin incluse
  assert.equal(annonceVisible(a, "2026-11-15", "2030"), false);
  assert.equal(annonceVisible(a, "2026-11-09", "2030"), false);
  const p = { ...a, promo: "2030" };
  assert.ok(annonceVisible(p, "2026-11-12", "2030"));
  assert.equal(annonceVisible(p, "2026-11-12", "2031"), false);
  assert.ok(annonceVisible(p, "2026-11-12", null));         // personnel sans promo
});

test("identifiants", () => {
  assert.equal(lireId(12), 12);
  assert.equal(lireId("12"), 12);
  for (const v of [0, -1, 1.5, "01", "1e3", "", null, "12a", Number.MAX_SAFE_INTEGER * 10]) {
    assert.equal(lireId(v), null, String(v));
  }
});

test("chapitres rattachés à leur année et leur matière", () => {
  assert.ok(chapitreDeLaMatiere("ce2-triphase", "a2", "ce"));
  assert.ok(chapitreDeLaMatiere("liaisons", "a1", "cm"));
  assert.ok(chapitreDeLaMatiere("produit-scalaire", "a2", "cm"));
  assert.ok(chapitreDeLaMatiere("oi-kanban", "a2", "oi"));
  assert.ok(chapitreDeLaMatiere("oi2-gps", "a2", "oi"));
  for (const [id, annee, matiere] of [
    ["ce2-triphase", "a1", "ce"], ["ce1-mcc", "a2", "ce"], ["oi1-coupe", "a2", "oi"], ["aii2-gemma", "a1", "aii"],
    ["liaisons", "a2", "cm"], ["liaisons-x", "a1", "cm"], ["cm1-", "a1", "cm"], ["ce2-triphase", "a2", "latin"],
    ["ce2-triphase", "a3", "ce"], ["x", "a2", "toString"], [42, "a2", "ce"],
  ]) {
    assert.equal(chapitreDeLaMatiere(id, annee, matiere), false, `${id} ${annee}/${matiere}`);
  }
  assert.ok(validerAnnonce({ ...base, annee: "a1", matiere: "cm", chapitres: ["liaisons", "cm1-statique"] }, AUJOURDHUI).annonce);
});

// Garde-fou : tout identifiant de leçon de la page doit appartenir à une seule paire
// année/matière, sinon un prof ne pourrait pas le cocher (ajouter son préfixe dans
// PREFIXES_CHAPITRES de src/regles-annonces.js).
test("toutes les leçons de index.html sont rattachées à une seule matière", () => {
  const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
  const ids = [...new Set([...page.matchAll(/lecon: "([a-z0-9-]+)"/g)].map((m) => m[1]))];
  assert.ok(ids.length > 50, "lecture de index.html");
  for (const id of [...ids, "liaisons", "produit-scalaire"]) {
    const paires = ANNEES.flatMap((a) => MATIERES.filter((m) => chapitreDeLaMatiere(id, a, m)).map((m) => a + "/" + m));
    assert.equal(paires.length, 1, `${id} : ${paires.join(", ") || "aucune paire"}`);
  }
});

test("nom affiché aux élèves à la place de l'adresse", () => {
  assert.equal(nomAffichable("jean-pierre.dupont2@icam.fr"), "Jean-Pierre Dupont");
  assert.equal(nomAffichable("prof.ce@icam.fr"), "Prof Ce");
  assert.equal(nomAffichable("marie_curie@icam.fr"), "Marie Curie");
  assert.equal(nomAffichable("123@icam.fr"), "Un prof");
  assert.equal(nomAffichable(null), "Un prof");
  assert.ok(!nomAffichable("a.b@icam.fr").includes("@"));
});
