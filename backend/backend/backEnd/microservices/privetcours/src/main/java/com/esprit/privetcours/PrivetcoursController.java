package com.esprit.privetcours;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/privetcours")
public class PrivetcoursController {
    @GetMapping
    public String sayHello() {
        return "Hello from Private Courses service";
    }
}
