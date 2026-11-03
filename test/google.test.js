import { test } from "node:test";
import assert from "node:assert/strict";
import { emailDepuisGoogle, lirePayloadJwt } from "../src/regles.js";

const CLIENT = "123.apps.googleusercontent.com";
const MAINTENANT = Date.UTC(2026, 10, 3);
const contexte = { clientId: CLIENT, nonce: "n0nce", maintenant: MAINTENANT };
const valide = {
  iss: "https://accounts.google.com",
  aud: CLIENT,
  exp: MAINTENANT / 1000 + 3600,
  nonce: "n0nce",
  email: "Prenom.Nom@icam.fr",
  email_verified: true,
  hd: "icam.fr",
};

function jwt(payload) {
  const morceau = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${morceau({ alg: "RS256" })}.${morceau(payload)}.signature`;
}

test("jeton ICAM valide accepté, adresse normalisée", () => {
  assert.equal(emailDepuisGoogle(valide, contexte), "prenom.nom@icam.fr");
  assert.equal(emailDepuisGoogle({ ...valide, iss: "accounts.google.com" }, contexte), "prenom.nom@icam.fr");
  assert.equal(emailDepuisGoogle({ ...valide, hd: "etudiant.icam.fr", email: "x@etudiant.icam.fr" }, contexte), "x@etudiant.icam.fr");
});

test("jetons refusés", () => {
  const cas = {
    "autre émetteur": { iss: "https://evil.example" },
    "autre application": { aud: "autre.apps.googleusercontent.com" },
    "expiré": { exp: MAINTENANT / 1000 - 1 },
    "exp absent": { exp: undefined },
    "nonce différent": { nonce: "autre" },
    "adresse non vérifiée": { email_verified: false },
    "email_verified en texte": { email_verified: "true" },
    "compte Google personnel (sans hd)": { hd: undefined },
    "autre Workspace": { hd: "fauxicam.fr" },
    "hd piégé": { hd: "icam.fr.evil.com" },
    "adresse hors ICAM": { email: "x@gmail.com" },
  };
  for (const [nom, modif] of Object.entries(cas)) {
    assert.equal(emailDepuisGoogle({ ...valide, ...modif }, contexte), null, nom);
  }
  assert.equal(emailDepuisGoogle(valide, { ...contexte, clientId: "" }), null, "client non configuré");
  assert.equal(emailDepuisGoogle({ ...valide, aud: undefined }, { ...contexte, clientId: undefined }), null, "aud et client absents");
  assert.equal(emailDepuisGoogle({ ...valide, nonce: undefined }, { ...contexte, nonce: undefined }), null, "nonce absent des deux côtés");
  assert.equal(emailDepuisGoogle(null, contexte), null);
});

test("lecture du jeton JWT", () => {
  assert.deepEqual(lirePayloadJwt(jwt(valide)), valide);
  const accents = { email: "é@icam.fr" };
  assert.deepEqual(lirePayloadJwt(jwt(accents)), accents);
  for (const jeton of [null, 42, "", "a.b", "a.b.c.d", "a.!!!.c", `a.${Buffer.from("[1]").toString("base64url")}.c`, "a.bm9uIGpzb24.c"]) {
    assert.equal(lirePayloadJwt(jeton), null, String(jeton));
  }
});
