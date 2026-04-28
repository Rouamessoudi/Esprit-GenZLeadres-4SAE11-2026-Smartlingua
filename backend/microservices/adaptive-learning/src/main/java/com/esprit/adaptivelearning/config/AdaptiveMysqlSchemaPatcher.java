package com.esprit.adaptivelearning.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Anciennes bases MySQL : tables adaptive créées sans certaines colonnes (timestamps).
 * Hibernate {@code ddl-auto=update} ne les ajoute pas toujours sur des tables déjà peuplées.
 * Patch idempotent au démarrage (MySQL uniquement).
 */
@Component
@Order(0)
@ConditionalOnProperty(name = "adaptive.schema.mysql-autopatch", havingValue = "true", matchIfMissing = true)
public class AdaptiveMysqlSchemaPatcher implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveMysqlSchemaPatcher.class);

    private final JdbcTemplate jdbc;
    private final String jdbcUrl;

    public AdaptiveMysqlSchemaPatcher(DataSource dataSource,
                                      @Value("${spring.datasource.url:}") String jdbcUrl) {
        this.jdbc = new JdbcTemplate(dataSource);
        this.jdbcUrl = jdbcUrl == null ? "" : jdbcUrl;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!jdbcUrl.contains("mysql")) {
            return;
        }
        try {
            patchIfMissing("learning_path", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("learning_path", "updated_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            patchIfMissing("learning_path", "goal", "VARCHAR(500) NOT NULL DEFAULT ''");
            patchIfMissing("learning_path_item", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("learning_path_item", "priority_score", "INT NOT NULL DEFAULT 0");
            patchIfMissing("student_learning_profile", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_learning_profile", "learning_goal", "VARCHAR(500) NOT NULL DEFAULT ''");
            ensureDefaultValue("student_learning_profile", "learning_goal", "VARCHAR(500) NOT NULL DEFAULT ''");
            patchIfMissing("student_placement_test_result", "test_date", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_placement_test_result", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_placement_test_result", "score_percent", "INT NOT NULL DEFAULT 0");
            patchIfMissing("student_level_test_result", "test_date", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_level_test_result", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_level_test_result", "score_percent", "INT NOT NULL DEFAULT 0");
            patchIfMissing("student_progress", "updated_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_progress", "total_lessons", "INT NOT NULL DEFAULT 0");
            patchIfMissing("student_progress", "completed_lessons", "INT NOT NULL DEFAULT 0");
            patchIfMissing("student_progress", "completion_percent", "DOUBLE NOT NULL DEFAULT 0");
            // Legacy columns may already exist without DEFAULT in older schemas.
            // Ensure inserts that don't explicitly include them still succeed.
            ensureDefaultValue("student_progress", "total_lessons", "INT NOT NULL DEFAULT 0");
            ensureDefaultValue("student_progress", "completed_lessons", "INT NOT NULL DEFAULT 0");
            ensureDefaultValue("student_progress", "completion_percent", "DOUBLE NOT NULL DEFAULT 0");
            patchIfMissing("student_gamification", "updated_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_gamification", "last_promotion_at", "DATETIME(6) NULL");
            patchIfMissing("learning_difficulty_alert", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("pedagogical_recommendation", "created_at", "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            patchIfMissing("student_level_test_result", "quiz_attempt_id", "BIGINT NULL");
        } catch (Exception e) {
            log.warn("Patch schéma MySQL adaptive ignoré ou partiel : {}", e.getMessage());
        }
    }

    private void patchIfMissing(String table, String column, String columnDefinition) {
        if (!tableExists(table) || columnExists(table, column)) {
            return;
        }
        String sql = "ALTER TABLE `" + table + "` ADD COLUMN `" + column + "` " + columnDefinition;
        jdbc.execute(sql);
        log.info("Colonne ajoutée : {}.{}", table, column);
    }

    private void ensureDefaultValue(String table, String column, String columnDefinition) {
        if (!tableExists(table) || !columnExists(table, column)) {
            return;
        }
        String sql = "ALTER TABLE `" + table + "` MODIFY COLUMN `" + column + "` " + columnDefinition;
        jdbc.execute(sql);
        log.info("Défaut appliqué : {}.{}", table, column);
    }

    private boolean tableExists(String table) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                Integer.class,
                table);
        return n != null && n > 0;
    }

    private boolean columnExists(String table, String column) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                table,
                column);
        return n != null && n > 0;
    }
}
