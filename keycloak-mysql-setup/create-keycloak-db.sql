-- ============================================================
-- Keycloak MySQL Database Setup
-- Run this in MySQL (mysql -u root -p < create-keycloak-db.sql)
-- or execute in phpMyAdmin / MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS keycloak
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'keycloak_user'@'localhost' IDENTIFIED BY 'keycloak_pass';

GRANT ALL PRIVILEGES ON keycloak.* TO 'keycloak_user'@'localhost';

FLUSH PRIVILEGES;
