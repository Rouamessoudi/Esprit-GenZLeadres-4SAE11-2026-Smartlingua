package com.esprit.forum;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/forum")
public class ForumController {
    @GetMapping
    public String sayHello() {
        return "Hello from Forum service";
    }
}
