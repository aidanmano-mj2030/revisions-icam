-- Corrections de cours par les profs et l'équipe (Espace prof, « Corriger les cours »).
--
-- Une ligne par correction d'un bloc d'une leçon. lecon = identifiant de LECONS
-- (public/index.html) ; bloc = type et empreinte du texte d'origine, ex. 'p-1k3x9za'
-- (public/prof-corrections.js), suivi de '-N' pour la Nᵉ occurrence d'un même texte dans la
-- leçon (cases « 0 » d'une table de vérité) ; annee et matiere = paire de la leçon dans CHAPITRES,
-- vérifiée par le serveur (src/lecons.js) ; original = texte d'origine, gardé pour la liste ;
-- texte = texte écrit par le prof, affiché par la page après échappement du HTML.
-- 500 corrections actives par leçon au plus (src/prof-corrections.js).
-- statut : active (affichée aux élèves), remplacee (une correction plus récente du même
-- bloc), annulee (retour au texte d'origine, annule_par = adresse de qui l'a annulée).
-- Une seule correction active par bloc. Les élèves voient le nom tiré de l'adresse.
CREATE TABLE corrections (
  id INTEGER PRIMARY KEY,
  lecon TEXT NOT NULL CHECK (length(lecon) BETWEEN 1 AND 60),
  bloc TEXT NOT NULL CHECK (length(bloc) BETWEEN 3 AND 30),
  annee TEXT NOT NULL CHECK (annee IN ('a1', 'a2')),
  matiere TEXT NOT NULL CHECK (matiere = lower(matiere) AND length(matiere) BETWEEN 1 AND 10),
  original TEXT NOT NULL CHECK (length(original) BETWEEN 1 AND 3000),
  texte TEXT NOT NULL CHECK (length(texte) BETWEEN 1 AND 3000),
  email_prof TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'remplacee', 'annulee')),
  annule_par TEXT,
  annule_le TEXT
);

-- une seule correction active par bloc
CREATE UNIQUE INDEX corrections_active ON corrections(lecon, bloc) WHERE statut = 'active';
-- liste de l'Espace prof par périmètre, et limite par prof sur 24 heures
CREATE INDEX corrections_perimetre ON corrections(annee, matiere, cree_le);
CREATE INDEX corrections_prof ON corrections(email_prof, cree_le);
