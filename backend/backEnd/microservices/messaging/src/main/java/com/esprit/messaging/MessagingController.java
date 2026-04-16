package com.esprit.messaging;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/messaging")
public class MessagingController {
    @GetMapping
    public String sayHello() {
        return "Hello from Messaging service";
    }
}
