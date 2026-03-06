-- ============================================================
-- SmartLingua Messaging - Voir toutes les données en base
-- Exécuter dans phpMyAdmin (onglet SQL) ou :
--   mysql -u root -p smartlingua_messaging < VOIR-DONNEES-BASE.sql
-- ============================================================

USE smartlingua_messaging;

SELECT '=== UTILISATEURS (app_user) ===' AS info;
SELECT id, username, email, role, created_at FROM app_user ORDER BY id;

SELECT '=== CONVERSATIONS ===' AS info;
SELECT id, participant1_id, participant2_id, created_at, updated_at
FROM conversations ORDER BY id;

SELECT '=== MESSAGES ===' AS info;
SELECT id, sender_id, receiver_id, LEFT(content, 50) AS content_preview, timestamp, is_read, conversation_id
FROM messages ORDER BY conversation_id, timestamp;

SELECT '=== INVITATIONS ===' AS info;
SELECT id, sender_id, receiver_id, LEFT(message, 40) AS message_preview, invitation_type, status, created_at
FROM invitations ORDER BY id;
