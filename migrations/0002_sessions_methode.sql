-- Seules les sessions ouvertes par la connexion Google (methode = 'google') sont acceptées :
-- les sessions de l'ancienne connexion par adresse seule deviennent invalides au déploiement.
ALTER TABLE sessions ADD COLUMN methode TEXT;
