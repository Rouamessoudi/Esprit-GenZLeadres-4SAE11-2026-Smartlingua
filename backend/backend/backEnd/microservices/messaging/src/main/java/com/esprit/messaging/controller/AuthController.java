package com.esprit.messaging.controller;

import com.esprit.messaging.dto.AuthResponse;
import com.esprit.messaging.dto.LoginRequest;
import com.esprit.messaging.dto.RegisterRequest;
import com.esprit.messaging.entity.User;
import com.esprit.messaging.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @Transactional
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank() ||
            req.getEmail() == null || req.getEmail().isBlank() ||
            req.getPassword() == null || req.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Tous les champs sont requis.");
        }
        String role = req.getRole() != null ? req.getRole().trim().toLowerCase() : null;
        if (!"student".equals(role) && !"teacher".equals(role)) {
            return ResponseEntity.badRequest().body("Choisis un rôle : Étudiant ou Enseignant.");
        }
        if (userRepository.existsByEmailIgnoreCase(req.getEmail().trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Cet email est déjà utilisé.");
        }
        try {
            String hash = passwordEncoder.encode(req.getPassword());
            User user = new User(
                req.getUsername().trim(),
                req.getEmail().trim().toLowerCase(),
                hash,
                role
            );
            user = userRepository.save(user);
            userRepository.flush();
            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de l'enregistrement : " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank() || req.getPassword() == null) {
            return ResponseEntity.badRequest().body("Email et mot de passe requis.");
        }
        User user = userRepository.findByEmailIgnoreCase(req.getEmail().trim()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect.");
        }
        return ResponseEntity.ok(new AuthResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole()));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AuthResponse>> listUsers() {
        List<AuthResponse> users = userRepository.findAll().stream()
            .map(u -> new AuthResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /** Pour vérifier que les utilisateurs sont bien enregistrés en base */
    @GetMapping("/debug-db")
    public ResponseEntity<java.util.Map<String, Object>> debugDb() {
        long count = userRepository.count();
        java.util.Map<String, Object> info = new java.util.HashMap<>();
        info.put("userCount", count);
        info.put("database", "MySQL (smartlingua_messaging)");
        return ResponseEntity.ok(info);
    }
}
