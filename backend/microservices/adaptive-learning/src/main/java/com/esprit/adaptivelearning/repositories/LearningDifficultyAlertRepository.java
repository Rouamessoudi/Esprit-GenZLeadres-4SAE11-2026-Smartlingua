package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.LearningDifficultyAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LearningDifficultyAlertRepository extends JpaRepository<LearningDifficultyAlert, Long> {
    long countByResolvedFalse();
    long countByStudentIdAndResolvedFalse(Long studentId);

    @Query("select count(distinct a.studentId) from LearningDifficultyAlert a where a.resolved = false")
    long countDistinctStudentsWithOpenAlerts();

    List<LearningDifficultyAlert> findTop20ByResolvedFalseOrderByCreatedAtDesc();
    List<LearningDifficultyAlert> findByStudentIdAndResolvedFalseOrderByCreatedAtDesc(Long studentId);

    boolean existsByStudentIdAndResolvedFalseAndReasonStartingWith(Long studentId, String prefix);
}
