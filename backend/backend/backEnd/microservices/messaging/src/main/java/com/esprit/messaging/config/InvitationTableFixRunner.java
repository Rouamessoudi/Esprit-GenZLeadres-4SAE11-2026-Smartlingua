package com.esprit.messaging.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InvitationTableFixRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InvitationTableFixRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public InvitationTableFixRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // 1) Donner des défauts aux colonnes type/date pour éviter "doesn't have a default value"
        List.of(
            "ALTER TABLE invitations MODIFY COLUMN `invitationType` VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION'",
            "ALTER TABLE invitations MODIFY COLUMN invitation_type VARCHAR(50) NOT NULL DEFAULT 'DISCUSSION'",
            "ALTER TABLE invitations MODIFY COLUMN created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)"
        ).forEach(sql -> runSql(sql, "invitations fix"));

        // 2) Supprimer les colonnes en double (camelCase) pour ne garder que snake_case (receiver_id, sender_id, etc.)
        //    Sinon l'INSERT Hibernate remplit receiver_id mais pas receiverId → erreur "receiverId doesn't have a default value"
        List.of(
            "ALTER TABLE invitations DROP COLUMN `receiverId`",
            "ALTER TABLE invitations DROP COLUMN `senderId`",
            "ALTER TABLE invitations DROP COLUMN `respondedAt`",
            "ALTER TABLE invitations DROP COLUMN `invitationType`",
            "ALTER TABLE invitations DROP COLUMN createdAt"
        ).forEach(sql -> runDrop(sql));
    }

    private void runDrop(String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.info("invitations: dropped duplicate column");
        } catch (Throwable ignored) {
            // colonne peut ne pas exister
        }
    }

    private void runSql(String sql, String label) {
        try {
            jdbcTemplate.execute(sql);
            log.info("invitations: {} ok", label);
        } catch (Throwable e) {
            log.debug("invitations: {} skipped - {}", label, e.getMessage());
        }
    }
}
