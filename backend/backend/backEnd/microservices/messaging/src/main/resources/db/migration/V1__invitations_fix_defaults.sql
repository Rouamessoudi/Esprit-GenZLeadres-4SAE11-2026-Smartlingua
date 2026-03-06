-- Migration: invitations.invitation_type NOT NULL avec défaut (fail-safe DB)
-- Exécuter si besoin: mysql -u root -p smartlingua_messaging < ce fichier

USE smartlingua_messaging;

-- Option 2 (fail-safe): DEFAULT pour invitation_type
ALTER TABLE invitations MODIFY COLUMN invitation_type VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION';

-- Si la colonne s'appelle invitationType (camelCase) :
-- ALTER TABLE invitations MODIFY COLUMN invitationType VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION';

-- created_at au cas où
ALTER TABLE invitations MODIFY COLUMN created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6);
