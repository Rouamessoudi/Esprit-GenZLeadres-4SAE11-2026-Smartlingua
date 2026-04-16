package com.esprit.forum.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Properties;

/**
 * Configure le fichier .h2.server.properties pour que la console H2
 * affiche par défaut l'URL de notre base de données (jdbc:h2:mem:forumdb).
 */
@Configuration
public class H2ConsoleConfig {

    @Value("${spring.datasource.url:jdbc:h2:mem:forumdb}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:Badia}")
    private String datasourceUsername;

    @Bean
    public ApplicationRunner initH2ConsoleSettings() {
        return args -> {
            try {
                String userHome = System.getProperty("user.home");
                // Fichier utilisé par la console H2: ~/.h2.server.properties
                File propsFile = new File(userHome, ".h2.server.properties");
                Properties props = new Properties();
                // Format: "name|driver|url|user" - utilisé par la console H2
                String connectionInfo = "Forum DB|org.h2.Driver|" + datasourceUrl + "|" + datasourceUsername;
                props.setProperty("0", connectionInfo);

                try (FileOutputStream fos = new FileOutputStream(propsFile)) {
                    props.store(fos, "SmartLingua Forum - H2 Console default connection");
                }
            } catch (Exception e) {
                // Pas bloquant - l'utilisateur peut saisir l'URL manuellement
                System.err.println("Impossible de configurer H2 console: " + e.getMessage());
            }
        };
    }
}
