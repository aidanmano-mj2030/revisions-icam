// Régénère src/lecons.js : pour chaque leçon de CHAPITRES (public/index.html), ses paires
// « annee/matiere ». Le serveur s'en sert pour vérifier qu'un prof corrige bien une leçon
// de son périmètre. À relancer après l'ajout ou le déplacement d'une leçon :
//   node scripts/maj-lecons.mjs
// test/corrections.test.js échoue tant que src/lecons.js n'est pas à jour.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ANNEES = { "1ère Année": "a1", "2ème Année": "a2" };

// Fin d'une expression qui commence à `depart` : premier `fin` (« } » ou « ; ») rencontré à
// la profondeur 0, parenthèses, crochets et accolades comptés hors des chaînes.
function jusquA(html, depart, fin) {
  let profondeur = 0, guillemet = null;
  for (let i = depart; i < html.length; i++) {
    const c = html[i];
    if (guillemet) {
      if (c === "\\") i++;
      else if (c === guillemet) guillemet = null;
    } else if (c === '"' || c === "'" || c === "`") guillemet = c;
    else if ("([{".includes(c)) profondeur++;
    else if (")]}".includes(c)) {
      profondeur--;
      if (fin === "}" && profondeur === 0) return html.slice(depart, i + 1);
    } else if (fin === ";" && c === ";" && profondeur === 0) return html.slice(depart, i + 1);
  }
  throw new Error("CHAPITRES : expression non refermée");
}

// CHAPITRES tel que la page le construit : l'objet littéral, puis les instructions de
// premier niveau qui le complètent (CHAPITRES["2ème Année"].CE = [...], .push(...), ...).
function construireChapitres(html) {
  const debut = html.indexOf("const CHAPITRES = {");
  if (debut < 0) throw new Error("CHAPITRES introuvable dans public/index.html");
  const chapitres = new Function("return " + jusquA(html, html.indexOf("{", debut), "}"))();
  for (const m of html.matchAll(/^ {0,8}CHAPITRES\[/gm)) {
    const instruction = jusquA(html, m.index + m[0].indexOf("C"), ";");
    new Function("CHAPITRES", instruction)(chapitres);
  }
  return chapitres;
}

// { "aii-grafcet": ["a1/aii"], ... } dans l'ordre de CHAPITRES.
export function lieuxDepuisIndex(html) {
  const chapitres = construireChapitres(html);
  const lieux = {};
  for (const [nomAnnee, matieres] of Object.entries(chapitres)) {
    const annee = ANNEES[nomAnnee];
    if (!annee) continue;
    for (const [matiere, liste] of Object.entries(matieres)) {
      for (const c of liste) {
        if (!c || typeof c.lecon !== "string") continue;
        const paire = `${annee}/${matiere.toLowerCase()}`;
        const paires = (lieux[c.lecon] ||= []);
        if (!paires.includes(paire)) paires.push(paire);
      }
    }
  }
  return lieux;
}

export function sourceLecons(lieux) {
  const lignes = Object.entries(lieux).map(([id, p]) => `  ${JSON.stringify(id)}: ${JSON.stringify(p)},`);
  return "// Généré par scripts/maj-lecons.mjs depuis CHAPITRES (public/index.html) : ne pas modifier à la main.\n"
    + "// Leçon → paires « annee/matiere » où elle apparaît.\n"
    + "export const LIEUX_LECONS = {\n" + lignes.join("\n") + "\n};\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const racine = new URL("../", import.meta.url);
  const lieux = lieuxDepuisIndex(readFileSync(new URL("public/index.html", racine), "utf8"));
  writeFileSync(new URL("src/lecons.js", racine), sourceLecons(lieux));
  console.log(`src/lecons.js : ${Object.keys(lieux).length} leçons`);
}
