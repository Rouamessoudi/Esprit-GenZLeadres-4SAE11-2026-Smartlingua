package com.esprit.messaging.repository;

import com.esprit.messaging.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByKeycloakSub(String keycloakSub);

    boolean existsByEmailIgnoreCase(String email);

    java.util.List<User> findByRoleIgnoreCase(String role);
}
