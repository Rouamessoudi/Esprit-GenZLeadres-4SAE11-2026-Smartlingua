package com.esprit.adaptivelearning.repositories;

import com.esprit.adaptivelearning.entities.StudentChapterProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentChapterProgressRepository extends JpaRepository<StudentChapterProgress, Long> {

    List<StudentChapterProgress> findByEnrollment_Id(Long enrollmentId);

    Optional<StudentChapterProgress> findByEnrollment_IdAndChapterId(Long enrollmentId, Long chapterId);
}
