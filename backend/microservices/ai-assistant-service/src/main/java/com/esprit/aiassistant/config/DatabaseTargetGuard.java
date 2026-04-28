package com.esprit.aiassistant.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Locale;

/**
 * Safety check: ensure this service writes to the expected MySQL database.
 */
@Component
public class DatabaseTargetGuard implements ApplicationRunner {

    private final DataSource dataSource;

    @Value("${app.database.enforce:true}")
    private boolean enforce;

    @Value("${app.database.required-name:smartlingua_messaging}")
    private String requiredDatabaseName;

    public DatabaseTargetGuard(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enforce) {
            return;
        }

        try (Connection connection = dataSource.getConnection()) {
            String catalog = connection.getCatalog();
            if (catalog == null || !catalog.toLowerCase(Locale.ROOT)
                .equals(requiredDatabaseName.toLowerCase(Locale.ROOT))) {
                throw new IllegalStateException(
                    "Invalid database target: expected '" + requiredDatabaseName + "' but got '" + catalog + "'."
                );
            }
        }
    }
}
