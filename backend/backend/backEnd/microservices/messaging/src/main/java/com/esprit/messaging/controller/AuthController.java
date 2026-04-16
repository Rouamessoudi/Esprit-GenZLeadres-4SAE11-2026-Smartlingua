package com.esprit.messaging.controller;

import com.esprit.messaging.dto.AuthResponse;
import com.esprit.messaging.dto.LoginRequest;
import com.esprit.messaging.dto.RegisterRequest;
import com.esprit.messaging.entity.User;
import com.esprit.messaging.repository.UserRepository;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;
    private final DataSource dataSource;

    public AuthController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        Environment environment,
        DataSource dataSource
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
        this.dataSource = dataSource;
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
            user = userRepository.saveAndFlush(user);

            // Guardrail: only return success after verifying the row is visible in MySQL.
            User persisted = userRepository.findByEmailIgnoreCase(user.getEmail()).orElse(null);
            if (persisted == null || persisted.getId() == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Inscription non persistée en base MySQL. Réessaie et vérifie la connexion DB.");
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(persisted.getId(), persisted.getUsername(), persisted.getEmail(), persisted.getRole()));
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

    /**
     * Vérification rapide : base réelle, profil Spring, nom de table JPA.
     * Les utilisateurs sont dans la table <strong>app_user</strong> (entité {@code User}), pas "users".
     */
    @GetMapping("/debug-db")
    public ResponseEntity<java.util.Map<String, Object>> debugDb() {
        long count = userRepository.count();
        java.util.Map<String, Object> info = new java.util.HashMap<>();
        info.put("userCount", count);
        info.put("usersTableName", "app_user");
        info.put("expectedMySqlSchema", "smartlingua_messaging");
        info.put("activeProfiles", Arrays.asList(environment.getActiveProfiles()));
        String jdbcUrl = "unknown";
        try (Connection c = dataSource.getConnection()) {
            jdbcUrl = c.getMetaData().getURL();
        } catch (Exception ignored) {
        }
        info.put("jdbcUrl", jdbcUrl);
        boolean h2 = jdbcUrl.contains("h2:") || jdbcUrl.contains(":h2:");
        boolean mysql = jdbcUrl.contains("mysql");
        if (h2) {
            info.put("storage", "H2 détecté (inattendu : le projet est configuré pour MySQL uniquement).");
            info.put("howToSeeInMySql", "Vérifie la configuration JDBC et redémarre le microservice.");
        } else if (mysql) {
            info.put("storage", "MySQL — ouvre la base smartlingua_messaging et la table app_user.");
        } else {
            info.put("storage", "Autre SGBD (voir jdbcUrl).");
        }
        return ResponseEntity.ok(info);
    }
}
