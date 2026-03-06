-- Exécuter UNE FOIS dans phpMyAdmin (base smartlingua_messaging) si tu as
-- l'erreur 500 ou "Unknown column" à l'inscription.
-- Supprime la table utilisateurs pour que le backend la recrée au redémarrage.

USE smartlingua_messaging;
DROP TABLE IF EXISTS app_user;

-- Ensuite redémarre le backend Messaging.
