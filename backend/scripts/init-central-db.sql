-- Base centrale SmartLingua - une seule base pour toute l'équipe
-- À exécuter dans PostgreSQL (client psql, pgAdmin, ou DBeaver).

-- ========== ÉTAPE 1 : Créer la base (à lancer une fois, connecté à la base "postgres") ==========
CREATE DATABASE smartlingua_db
  WITH ENCODING = 'UTF8';

-- ========== ÉTAPE 2 : Se connecter à la base smartlingua_db puis exécuter ci-dessous ==========

-- Schémas pour chaque microservice (chaque équipe travaille dans son schéma)
CREATE SCHEMA IF NOT EXISTS courses;   -- microservice courses (cours)
CREATE SCHEMA IF NOT EXISTS users;     -- microservice users (profils)
CREATE SCHEMA IF NOT EXISTS quiz;      -- microservice quiz
CREATE SCHEMA IF NOT EXISTS forum;     -- microservice forum
CREATE SCHEMA IF NOT EXISTS exams;     -- microservice exams
CREATE SCHEMA IF NOT EXISTS messaging; -- microservice messaging
CREATE SCHEMA IF NOT EXISTS privetcours; -- microservice privetcours

-- Utilisateur commun pour les microservices (optionnel, plus sécurisé qu'utiliser postgres)
-- CREATE USER smartlingua_app WITH PASSWORD 'votre_mot_de_passe';
-- GRANT CONNECT ON DATABASE smartlingua_db TO smartlingua_app;
-- GRANT USAGE ON SCHEMA courses TO smartlingua_app;
-- GRANT USAGE ON SCHEMA users TO smartlingua_app;
-- GRANT USAGE ON SCHEMA quiz TO smartlingua_app;
-- GRANT USAGE ON SCHEMA forum TO smartlingua_app;
-- GRANT USAGE ON SCHEMA exams TO smartlingua_app;
-- GRANT USAGE ON SCHEMA messaging TO smartlingua_app;
-- GRANT USAGE ON SCHEMA privetcours TO smartlingua_app;
-- GRANT CREATE ON SCHEMA courses TO smartlingua_app;
-- GRANT CREATE ON SCHEMA users TO smartlingua_app;
-- GRANT CREATE ON SCHEMA quiz TO smartlingua_app;
-- GRANT CREATE ON SCHEMA forum TO smartlingua_app;
-- GRANT CREATE ON SCHEMA exams TO smartlingua_app;
-- GRANT CREATE ON SCHEMA messaging TO smartlingua_app;
-- GRANT CREATE ON SCHEMA privetcours TO smartlingua_app;
