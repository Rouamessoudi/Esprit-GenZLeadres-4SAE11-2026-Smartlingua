package com.esprit.adaptivelearning.feign;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.codec.Decoder;
import feign.jackson.JacksonDecoder;
import org.springframework.context.annotation.Bean;

/**
 * Décodage JSON pour les clients Feign (users, courses). {@link JacksonDecoder} évite l'erreur
 * « no suitable HttpMessageConverter » quand le contexte Feign n'a pas les converters Spring MVC.
 */
public class FeignClientJacksonConfig {

    @Bean
    Decoder feignJacksonDecoder(ObjectMapper objectMapper) {
        return new JacksonDecoder(objectMapper);
    }
}
