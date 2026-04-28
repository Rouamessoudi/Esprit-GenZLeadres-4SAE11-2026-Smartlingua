package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentLearningProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentLearningProfileRepository extends JpaRepository<StudentLearningProfile, Long> {
    Optional<StudentLearningProfile> findByStudentId(Long studentId);

    long count();
}
