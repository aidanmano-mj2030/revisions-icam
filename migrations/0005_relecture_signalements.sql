-- Relecture des leçons par les profs et signalements d'erreurs par les élèves.
--
-- relectures : un prof marque une leçon de son périmètre comme relue (une ligne par leçon
--   et par prof). lecon = identifiant de LECONS dans public/index.html, annee a1/a2,
--   matiere = id de MATIERES en minuscules (cm, ce, aii, oi, est, maths, phys, eco).
--   Les élèves ne voient que le nom tiré de l'adresse (« Prenom Nom »), jamais l'adresse.
--
-- signalements : « Signaler une erreur » en bas d'une leçon ou d'un exercice.
--   cle_exo = clé de EXOS si le signalement vient d'un exercice, sinon NULL.
--   Les profs voient ceux de leur périmètre sans l'identité de l'élève ; l'équipe voit tout.
--   statut : ouvert à la création, puis corrige ou rejete (traite_par = adresse du prof).
--   Les profs reçoivent la date au jour (pas l'heure, qui pourrait désigner l'élève).
--   ON DELETE CASCADE : effacer un compte (voir /confidentialite) efface ses signalements.
CREATE TABLE relectures (
  lecon TEXT NOT NULL,
  annee TEXT NOT NULL,
  matiere TEXT NOT NULL,
  email_prof TEXT NOT NULL,
  le TEXT NOT NULL,
  PRIMARY KEY (lecon, email_prof)
);

CREATE TABLE signalements (
  id INTEGER PRIMARY KEY,
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  annee TEXT NOT NULL,
  matiere TEXT NOT NULL,
  lecon TEXT NOT NULL,
  cle_exo TEXT,
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'corrige', 'rejete')),
  cree_le TEXT NOT NULL,
  traite_par TEXT,
  traite_le TEXT
);

-- file des profs (par périmètre et statut) et limite de 5 par élève et par jour
CREATE INDEX signalements_file ON signalements(annee, matiere, statut, cree_le);
CREATE INDEX signalements_eleve ON signalements(utilisateur_id, cree_le);
