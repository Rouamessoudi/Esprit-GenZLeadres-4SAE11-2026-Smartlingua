-- ============================================================
-- FIX TABLE INVITATIONS - À exécuter UNE FOIS dans MySQL
-- Si tu as "Invitation non envoyée", exécute ce script.
-- ============================================================
-- Dans phpMyAdmin : sélectionne la base smartlingua_messaging,
-- onglet SQL, colle ce script et exécute.
-- Si la 1ère ALTER échoue (Unknown column 'invitationType'), exécute seulement les 2 dernières.
--   mysql -u root -p smartlingua_messaging < fix-invitations-table.sql
-- ============================================================

USE smartlingua_messaging;

-- 1) Donner une valeur par défaut à la colonne invitationType si elle existe
ALTER TABLE invitations MODIFY COLUMN `invitationType` VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION';

-- 2) S'assurer que invitation_type a un défaut
ALTER TABLE invitations MODIFY COLUMN invitation_type VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION';

-- 3) S'assurer que created_at a un défaut
ALTER TABLE invitations MODIFY COLUMN created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6);

-- 4) Supprimer les colonnes en double (camelCase) qui provoquent "receiverId/senderId doesn't have a default value"
--    Exécuter une par une ; ignorer les erreurs "Unknown column" si la colonne n'existe pas.
ALTER TABLE invitations DROP COLUMN `receiverId`;
ALTER TABLE invitations DROP COLUMN `senderId`;
ALTER TABLE invitations DROP COLUMN `respondedAt`;
ALTER TABLE invitations DROP COLUMN `invitationType`;
ALTER TABLE invitations DROP COLUMN createdAt;
