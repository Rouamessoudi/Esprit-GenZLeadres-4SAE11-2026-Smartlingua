package com.esprit.forum.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> getRoot() {
        return Map.of(
                "service", "Forum - SmartLingua",
                "message", "Module Communication, Announcements et Forum",
                "endpoints", Map.of(
                        "forum", "http://localhost:8090/forum",
                        "announcements", "http://localhost:8090/forum/announcements",
                        "posts", "http://localhost:8090/forum/posts",
                        "comments", "http://localhost:8090/forum/comments",
                        "h2Console", "http://localhost:8090/h2",
                        "dbConnectionInfo", "http://localhost:8090/db"
                )
        );
    }

    @GetMapping("/db")
    public Map<String, String> getDbConnectionInfo() {
        return Map.of(
                "instruction", "Dans la console H2, remplacez l'URL par celle-ci (Ctrl+A puis coller):",
                "jdbcUrl", "jdbc:h2:mem:forumdb",
                "username", "Badia",
                "password", "(laisser vide)",
                "h2Console", "http://localhost:8090/h2"
        );
    }
}
