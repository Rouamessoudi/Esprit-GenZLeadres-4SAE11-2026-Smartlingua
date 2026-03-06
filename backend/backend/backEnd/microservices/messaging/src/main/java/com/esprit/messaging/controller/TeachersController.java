package com.esprit.messaging.controller;

import com.esprit.messaging.dto.AuthResponse;
import com.esprit.messaging.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/** GET /api/teachers - Liste des enseignants */
@RestController
@RequestMapping("/api")
public class TeachersController {

    private final UserRepository userRepository;

    public TeachersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<AuthResponse>> listTeachers() {
        List<AuthResponse> teachers = userRepository.findByRoleIgnoreCase("teacher").stream()
            .map(u -> new AuthResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(teachers);
    }
}
