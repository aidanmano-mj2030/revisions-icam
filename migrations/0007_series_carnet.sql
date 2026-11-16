-- Ma progression : séries terminées et carnet d'erreurs (lot 3). Seulement des créations,
-- aucune table existante n'est modifiée.
--
-- series : une ligne par série de QCM terminée (examen de la Révision DS, QCM d'un chapitre,
--   série « Refaire »), envoyée par public/ma-progression.js à POST /api/series.
--   cle      = clé de progression de la série (ex. a2/ds/ds-2026-11/examen-ce) ;
--   annee    = a1|a2, NULL pour une série « Refaire » qui mélange les deux années ;
--   matiere  = id de MATIERES en minuscules, NULL pour une série qui mélange plusieurs
--              matières (examen blanc « tout » : CE et OI) ;
--   titre    = libellé affiché à l'élève (texte simple, affiché par textContent) ;
--   mode     = entrainement | ds ; refaire = 1 pour une série lancée depuis le carnet
--              d'erreurs ou depuis un bilan (clé serie/refaire), exclue de la courbe des notes ;
--   total, justes, note20, pourcent, duree_s (NULL si inconnue), fait_le (ISO).
--   1000 séries par élève au plus (les plus anciennes sont supprimées), deux ans au plus.
--
-- questions_suivi : une ligne par élève et par question de QCM déjà répondue dans une série.
--   question = identifiant stable « <source>#<h> » (rds/<partie>/<sujet>#<8 hex> ou
--              exo/<clé EXOS>#<8 hex>) ;
--   annee, matiere = matière de la question (CE pour rds/ce, OI pour rds/expo et rds/cours,
--              matière de la série pour exo/...) ;
--   chapitre = libellé lisible, pour grouper le carnet ;
--   premier_juste = 1 si la toute première réponse était juste (sert au taux d'échec des profs) ;
--   echecs, reussites = compteurs de toutes les réponses ;
--   a_refaire = 1 si la dernière réponse était fausse : la question est dans le carnet
--              d'erreurs ; une réponse juste plus tard la sort du carnet, les compteurs restent ;
--   dernier_echec = date ISO du dernier échec.
--   3000 questions par élève au plus, deux ans au plus.
--
-- Les profs ne lisent jamais ces tables ligne à ligne : /api/prof/questions renvoie seulement,
-- par promo, les questions répondues par au moins 5 élèves, avec une tranche de 20 % du taux
-- d'échec (src/regles-questions.js).
-- ON DELETE CASCADE : effacer un compte (voir /confidentialite) efface ses séries et son carnet.
CREATE TABLE series (
  id INTEGER PRIMARY KEY,
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  cle TEXT NOT NULL CHECK (length(cle) BETWEEN 1 AND 120),
  annee TEXT CHECK (annee IS NULL OR annee IN ('a1', 'a2')),
  matiere TEXT CHECK (matiere IS NULL OR (matiere = lower(matiere) AND length(matiere) BETWEEN 1 AND 10)),
  titre TEXT NOT NULL CHECK (length(titre) BETWEEN 1 AND 120),
  mode TEXT NOT NULL CHECK (mode IN ('entrainement', 'ds')),
  refaire INTEGER NOT NULL DEFAULT 0 CHECK (refaire IN (0, 1)),
  total INTEGER NOT NULL CHECK (total BETWEEN 1 AND 300),
  justes INTEGER NOT NULL CHECK (justes BETWEEN 0 AND total),
  note20 REAL NOT NULL CHECK (note20 BETWEEN 0 AND 20),
  pourcent INTEGER NOT NULL CHECK (pourcent BETWEEN 0 AND 100),
  duree_s INTEGER CHECK (duree_s IS NULL OR duree_s BETWEEN 0 AND 86400),
  fait_le TEXT NOT NULL
);

-- dernières séries d'un élève, élagage et limite par élève
CREATE INDEX series_eleve ON series(utilisateur_id, fait_le);

CREATE TABLE questions_suivi (
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (length(question) BETWEEN 12 AND 120),
  annee TEXT NOT NULL CHECK (annee IN ('a1', 'a2')),
  matiere TEXT NOT NULL CHECK (matiere = lower(matiere) AND length(matiere) BETWEEN 1 AND 10),
  chapitre TEXT NOT NULL CHECK (length(chapitre) BETWEEN 1 AND 120),
  premier_juste INTEGER NOT NULL CHECK (premier_juste IN (0, 1)),
  echecs INTEGER NOT NULL DEFAULT 0,
  reussites INTEGER NOT NULL DEFAULT 0,
  a_refaire INTEGER NOT NULL DEFAULT 0 CHECK (a_refaire IN (0, 1)),
  dernier_echec TEXT,
  maj_le TEXT NOT NULL,
  PRIMARY KEY (utilisateur_id, question)
);

-- carnet d'erreurs d'un élève
CREATE INDEX questions_suivi_carnet ON questions_suivi(utilisateur_id, a_refaire, dernier_echec);
-- vue prof : questions d'une matière
CREATE INDEX questions_suivi_matiere ON questions_suivi(annee, matiere, question);
-- élagage des lignes de plus de deux ans
CREATE INDEX questions_suivi_maj ON questions_suivi(utilisateur_id, maj_le);
