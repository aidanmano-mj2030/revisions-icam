CREATE TABLE utilisateurs (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  cree_le TEXT,
  vu_le TEXT
);

CREATE TABLE sessions (
  jeton_hash TEXT PRIMARY KEY,
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
  expire_le TEXT
);

CREATE INDEX sessions_expire_le ON sessions(expire_le);

CREATE TABLE progression (
  utilisateur_id INTEGER,
  cle TEXT,
  reussi INTEGER,
  score REAL NULL,
  maj_le TEXT,
  PRIMARY KEY (utilisateur_id, cle)
);
