package com.esprit.users.services;

import com.esprit.users.dto.UserSyncDto;
import com.esprit.users.entities.User;
import com.esprit.users.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll().stream().filter(u -> !u.isDeleted()).toList();
    }

    @Transactional(readOnly = true)
    public Optional<User> findByKeycloakId(String keycloakId) {
        return userRepository.findByKeycloakIdAndDeletedFalse(keycloakId);
    }

    /**
     * Crée ou met à jour un utilisateur dans notre base à partir des infos Keycloak (inscription/connexion).
     */
    @Transactional
    public User syncUser(UserSyncDto dto) {
        if (dto == null || dto.getKeycloakId() == null || dto.getUsername() == null) {
            throw new IllegalArgumentException("keycloakId et username requis");
        }
        User user = userRepository.findByKeycloakId(dto.getKeycloakId())
                .orElse(new User());
        user.setKeycloakId(dto.getKeycloakId());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setRole(normalizeRole(dto.getRole()));
        user.setDeleted(false);
        user.setEnabled(true);
        if (user.getId() == null) {
            user.setCreatedAt(java.time.Instant.now());
        }
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> searchAdminUsers(String role, String query) {
        String normalizedRole = (role == null || role.isBlank()) ? null : normalizeRole(role);
        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        return userRepository.searchAdminUsers(normalizedRole, normalizedQuery);
    }

    @Transactional
    public User softDeleteUser(Long id) {
        User user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        user.setDeleted(true);
        user.setEnabled(false);
        return userRepository.save(user);
    }

    @Transactional
    public User updateRole(Long id, String role) {
        User user = userRepository.findByIdAndDeletedFalse(id)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        user.setRole(normalizeRole(role));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public long countStudents() {
        return userRepository.countByRoleIgnoreCaseAndDeletedFalse("STUDENT");
    }

    @Transactional(readOnly = true)
    public long countTeachers() {
        return userRepository.countByRoleIgnoreCaseAndDeletedFalse("TEACHER");
    }

    @Transactional(readOnly = true)
    public long countUsers() {
        return userRepository.countByDeletedFalse();
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "STUDENT";
        }
        String normalized = role.trim().toUpperCase();
        return normalized.replaceFirst("^ROLE_", "");
    }
}
