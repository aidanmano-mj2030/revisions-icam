-- Annonces des profs : un message épinglé en tête d'une matière (« DS jeudi, revoir les
-- chapitres 2 et 4 »), visible des élèves de debut à fin inclus, puis plus rien.
--   annee, matiere : a1|a2 et id de MATIERES en minuscules (cm, ce, aii, oi, est, maths, phys, eco).
--   promo     : facultative, ex. '2030' : seuls les élèves en @2030.icam.fr la voient ;
--               NULL : tous les élèves de l'année.
--   texte     : texte simple, 500 caractères au plus, affiché par textContent.
--   chapitres : identifiants de leçons de CHAPITRES (index.html) séparés par des virgules,
--               ex. 'ce2-triphase,ce2-magneto' ; '' si aucun.
--   debut, fin : dates AAAA-MM-JJ (heure de Paris), fin incluse.
-- Règles (src/regles-annonces.js, src/prof-annonces.js) : 20 annonces non terminées par prof,
-- un prof ne supprime que les siennes, l'équipe toutes.
CREATE TABLE annonces (
  id INTEGER PRIMARY KEY,
  email_prof TEXT NOT NULL,
  annee TEXT NOT NULL CHECK (annee IN ('a1', 'a2')),
  matiere TEXT NOT NULL CHECK (matiere = lower(matiere) AND length(matiere) BETWEEN 1 AND 10),
  promo TEXT CHECK (promo IS NULL OR (length(promo) = 4 AND promo NOT GLOB '*[^0-9]*')),
  texte TEXT NOT NULL CHECK (length(texte) BETWEEN 1 AND 500),
  chapitres TEXT NOT NULL DEFAULT '',
  debut TEXT NOT NULL CHECK (debut GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  fin TEXT NOT NULL CHECK (fin GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND fin >= debut),
  cree_le TEXT NOT NULL
);

-- Lecture élève : annonces d'une matière encore en cours.
CREATE INDEX annonces_matiere_fin ON annonces(annee, matiere, fin);
-- Compte des annonces actives d'un prof.
CREATE INDEX annonces_prof_fin ON annonces(email_prof, fin);
