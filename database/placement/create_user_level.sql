-- Placement Test module — structure uniquement (aucune modification des tables existantes).
-- Base cible : MySQL (ex. forumdb), table utilisateurs existante : app_user
-- Exécuter manuellement une fois la base et app_user présents : mysql -u ... forumdb < create_user_level.sql

CREATE TABLE IF NOT EXISTS user_level (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT 'Référence logique vers app_user.id',
    spoken_text TEXT NULL COMMENT 'Texte issu de la reconnaissance vocale / transcription',
    score DECIMAL(8, 2) NULL COMMENT 'Score du test de placement',
    level VARCHAR(64) NULL COMMENT 'Niveau attribué (ex. A1, B2, ou libellé métier)',
    errors_count INT NOT NULL DEFAULT 0 COMMENT 'Nombre d erreurs détectées',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_level_user_id (user_id),
    CONSTRAINT fk_user_level_app_user
        FOREIGN KEY (user_id) REFERENCES app_user (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
