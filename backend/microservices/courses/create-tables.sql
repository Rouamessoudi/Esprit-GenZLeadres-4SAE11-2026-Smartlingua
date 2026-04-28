-- Création des tables pour le microservice courses (base smartlingua_users)
-- Exécuter ce script dans MySQL si la table 'courses' n'existe pas encore.
-- Cela permet à IntelliJ de résoudre l'erreur "Cannot resolve table 'courses'"
-- si une source de données pointe vers cette base.

USE smartlingua_users;

-- Table des cours
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(1000),
    level VARCHAR(10),
    start_date DATE,
    end_date DATE,
    price DOUBLE
);

-- Table des ressources (liées à un cours)
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    type VARCHAR(20),
    url VARCHAR(500),
    course_id BIGINT,
    CONSTRAINT fk_resource_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table des séances (liées à un cours)
CREATE TABLE IF NOT EXISTS seances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    start_date_time DATETIME,
    duration_minutes INT,
    description VARCHAR(500),
    course_id BIGINT,
    CONSTRAINT fk_seance_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);
