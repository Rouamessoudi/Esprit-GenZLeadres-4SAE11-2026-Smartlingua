-- Créer la base pour enregistrer les utilisateurs (SmartLingua Messaging)
-- À exécuter dans phpMyAdmin (onglet SQL) ou en ligne de commande MySQL.

CREATE DATABASE IF NOT EXISTS smartlingua_messaging
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartlingua_messaging;

-- Les tables (app_user, messages, etc.) sont créées automatiquement par Hibernate
-- au démarrage de MessagingApplication. Tu n'as pas besoin de les créer à la main.
-- Ce script crée seulement la base vide.
