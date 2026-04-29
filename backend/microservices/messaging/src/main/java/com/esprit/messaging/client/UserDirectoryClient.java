package com.esprit.messaging.client;

import com.esprit.messaging.dto.UserSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Component
public class UserDirectoryClient {

    private final RestClient restClient;

    public UserDirectoryClient(@Value("${users.service.base-url:http://localhost:8087}") String usersBaseUrl) {
        this.restClient = RestClient.builder()
            .baseUrl(usersBaseUrl)
            .build();
    }

    public List<UserSummary> getAllUsers() {
        try {
            List<UserSummary> users = restClient
                .get()
                .uri("/api/users/all")
                .retrieve()
                .body(new ParameterizedTypeReference<List<UserSummary>>() {});
            return users == null ? Collections.emptyList() : users;
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
