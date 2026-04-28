package com.esprit.quiz.repositories;

import com.esprit.quiz.entities.LevelFinalAttempt;
import com.esprit.quiz.entities.LevelFinalAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LevelFinalAttemptRepository extends JpaRepository<LevelFinalAttempt, Long> {
    long countByStatus(LevelFinalAttemptStatus status);
}
