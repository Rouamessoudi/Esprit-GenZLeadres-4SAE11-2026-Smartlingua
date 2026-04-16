package com.esprit.messaging.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;

/**
 * MySQL réel pour les tests (pas de H2).
 * <ul>
 *   <li>Par défaut : JDBC depuis {@code application-test.properties} (MySQL local XAMPP, port 3306).</li>
 *   <li>{@code -DuseTestcontainers=true} ou {@code USE_TESTCONTAINERS=true} : MySQL 8 dans Docker (nécessite Docker).</li>
 * </ul>
 */
public abstract class MysqlTestContainerBase {

    private static final Object LOCK = new Object();
    private static MySQLContainer<?> mysql;

    private static boolean shouldUseTestcontainers() {
        return Boolean.getBoolean("useTestcontainers")
            || "true".equalsIgnoreCase(System.getenv("USE_TESTCONTAINERS"));
    }

    @DynamicPropertySource
    static void registerMysqlProperties(DynamicPropertyRegistry registry) {
        if (!shouldUseTestcontainers()) {
            return;
        }
        synchronized (LOCK) {
            if (mysql == null) {
                mysql = new MySQLContainer<>("mysql:8.0")
                    .withDatabaseName("messaging_tc")
                    .withUsername("root")
                    .withPassword("test");
                mysql.start();
            }
        }
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }
}
