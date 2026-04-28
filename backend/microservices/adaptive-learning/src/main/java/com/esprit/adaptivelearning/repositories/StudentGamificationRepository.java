package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentGamification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentGamificationRepository extends JpaRepository<StudentGamification, Long> {
    Optional<StudentGamification> findByStudentId(Long studentId);
}
