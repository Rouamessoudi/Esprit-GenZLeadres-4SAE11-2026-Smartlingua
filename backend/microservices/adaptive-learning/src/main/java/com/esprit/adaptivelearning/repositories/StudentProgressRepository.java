package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, Long> {
    Optional<StudentProgress> findTopByStudentIdOrderByUpdatedAtDesc(Long studentId);
    Optional<StudentProgress> findByLearningPathId(Long learningPathId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(p.completionPercentage) FROM StudentProgress p")
    Double averageCompletionPercentage();
}
