-- Base : smartlingua_messaging
-- Table : bad_word (colonne : word)
-- Exécuter ce script après avoir démarré au moins une fois le microservice Messaging (pour créer la table).

USE smartlingua_messaging;

-- Insérer les 4 mots interdits (ignorer si déjà présents)
INSERT IGNORE INTO bad_word (word) VALUES
  ('qqqqq'),
  ('sssss'),
  ('ddddd'),
  ('fffff');

-- Vérifier le contenu
SELECT * FROM bad_word;
