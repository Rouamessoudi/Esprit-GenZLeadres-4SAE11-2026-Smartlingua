package com.esprit.users.service;

import com.esprit.users.entity.User;
import com.esprit.users.repository.UserRepository;
import com.esprit.users.dto.SignupRequest;
import com.esprit.users.dto.LoginRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public List<User> findAll() {
        return repository.findAll();
    }

    public Optional<User> findById(Long id) {
        return repository.findById(id);
    }

    public User create(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        if (repository.existsByEmailIgnoreCase(user.getEmail().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists.");
        }
        User u = new User(
            user.getUsername().trim(),
            user.getEmail().trim().toLowerCase(),
            user.getFullName() != null ? user.getFullName().trim() : null,
            normalizeRole(user.getRole())
        );
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            u.setPassword(hashPassword(user.getPassword()));
        }
        return repository.save(u);
    }

    public User signup(SignupRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet email est deja utilise.");
        }
        User user = new User(
                request.getUsername().trim(),
                email,
                request.getUsername().trim(),
                normalizeRole(request.getRole())
        );
        user.setPassword(hashPassword(request.getPassword()));
        return repository.save(user);
    }

    public User login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Compte non configure pour la connexion locale.");
        }
        String provided = hashPassword(request.getPassword());
        if (!provided.equals(user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect.");
        }
        return user;
    }

    public User update(Long id, User user) {
        User existing = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            existing.setUsername(user.getUsername().trim());
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String email = user.getEmail().trim().toLowerCase();
            if (!email.equals(existing.getEmail()) && repository.existsByEmailIgnoreCase(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists.");
            }
            existing.setEmail(email);
        }
        if (user.getFullName() != null) {
            existing.setFullName(user.getFullName().trim());
        }
        if (user.getRole() != null && !user.getRole().isBlank()) {
            existing.setRole(normalizeRole(user.getRole()));
        }
        return repository.save(existing);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
        }
        repository.deleteById(id);
    }

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur serveur lors du traitement du mot de passe.");
        }
    }

    private String normalizeRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "STUDENT";
        }
        String role = rawRole.trim().toUpperCase(Locale.ROOT);
        if ("TEACHER".equals(role)) {
            return "PROF";
        }
        if ("PROF".equals(role) || "STUDENT".equals(role)) {
            return role;
        }
        return "STUDENT";
    }
}
