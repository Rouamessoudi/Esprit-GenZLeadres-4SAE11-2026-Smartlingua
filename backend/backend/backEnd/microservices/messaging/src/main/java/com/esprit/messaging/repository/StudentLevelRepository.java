package com.esprit.messaging.repository;

import com.esprit.messaging.entity.StudentLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentLevelRepository extends JpaRepository<StudentLevel, Long> {
    Optional<StudentLevel> findByUserId(Long userId);
}
