package com.esprit.aiassistant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    /** Client HTTP vers {@code https://generativelanguage.googleapis.com} (chemins relatifs dans {@code GeminiService}). */
    @Bean
    public RestClient geminiRestClient() {
        return RestClient.builder()
            .baseUrl("https://generativelanguage.googleapis.com")
            .build();
    }
}
