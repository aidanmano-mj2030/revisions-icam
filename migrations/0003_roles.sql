-- Rôles de l'accès prof, par adresse : on peut ajouter un prof avant sa première connexion.
-- Un rôle n'est jamais déduit de l'adresse (@icam.fr seul ne donne rien).
--   prof    : voit seulement son périmètre.
--   equipe  : Aidan et Baptiste, voient tout (perimetre ignoré).
-- perimetre : paires année/matière séparées par des virgules, en minuscules,
--   années a1 ou a2, matières cm, ce, aii, oi, est, maths, phys, eco. Exemple : 'a2/ce,a2/oi'.
--   Une paire mal écrite est ignorée (voir lirePerimetre dans src/regles.js).
--
-- Ajouter un prof (adresse en minuscules, sinon l'insertion est refusée) :
--   INSERT INTO roles (email, role, perimetre, ajoute_par, ajoute_le)
--   VALUES ('prenom.nom@icam.fr', 'prof', 'a2/ce', 'aidan', datetime('now'))
--   ON CONFLICT(email) DO UPDATE SET role = excluded.role, perimetre = excluded.perimetre,
--     ajoute_par = excluded.ajoute_par, ajoute_le = excluded.ajoute_le;
-- Retirer un rôle : DELETE FROM roles WHERE email = 'prenom.nom@icam.fr';
-- Le changement vaut dès la requête suivante (le rôle est relu à chaque requête).
CREATE TABLE roles (
  email TEXT PRIMARY KEY CHECK (email = lower(trim(email)) AND email LIKE '%_@_%'),
  role TEXT NOT NULL CHECK (role IN ('prof', 'equipe')),
  perimetre TEXT NOT NULL DEFAULT '',
  ajoute_par TEXT,
  ajoute_le TEXT
);
