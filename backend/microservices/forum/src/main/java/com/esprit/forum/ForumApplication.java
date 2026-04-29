package com.esprit.forum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(
    basePackages = {
        "com.esprit.forum.controllers",
        "com.esprit.forum.repositories",
        "com.esprit.forum.entities",
        "com.esprit.forum.config",
        "com.esprit.forum.security"
    }
)
public class ForumApplication {

    public static void main(String[] args) {
        SpringApplication.run(ForumApplication.class, args);
    }

}
