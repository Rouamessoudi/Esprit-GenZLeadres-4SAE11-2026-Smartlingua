package com.esprit.users.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** Allowed origins for CORS (Angular dev server). Comma-separated, e.g. http://localhost:4200,http://localhost:4201 */
    @Value("${cors.allowed-origins:http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:54919,http://127.0.0.1:4200,http://127.0.0.1:4201,http://127.0.0.1:4202,http://127.0.0.1:54919}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("*")
            .maxAge(3600);
    }
}
