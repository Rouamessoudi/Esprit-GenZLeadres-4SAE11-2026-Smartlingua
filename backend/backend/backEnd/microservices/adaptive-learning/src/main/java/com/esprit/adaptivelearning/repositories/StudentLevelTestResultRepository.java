package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentLevelTestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface StudentLevelTestResultRepository extends JpaRepository<StudentLevelTestResult, Long> {
    boolean existsByStudentIdAndPassedFalseAndTestDateAfter(Long studentId, Instant after);

    boolean existsByQuizAttemptId(Long quizAttemptId);
}
