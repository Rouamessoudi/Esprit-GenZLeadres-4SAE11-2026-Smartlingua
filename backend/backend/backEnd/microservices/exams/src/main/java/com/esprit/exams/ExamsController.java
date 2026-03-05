package com.esprit.exams;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/exams")
public class ExamsController {
    @GetMapping
    public String sayHello() {
        return "Hello from Exams service";
    }
}
