package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentPlacementTestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentPlacementTestResultRepository extends JpaRepository<StudentPlacementTestResult, Long> {
    Optional<StudentPlacementTestResult> findTopByStudentIdOrderByTestDateDesc(Long studentId);
    boolean existsByStudentId(Long studentId);
}
