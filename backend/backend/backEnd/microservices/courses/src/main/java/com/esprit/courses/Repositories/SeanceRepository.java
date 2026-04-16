package com.esprit.courses.Repositories;

import com.esprit.courses.entities.Seance;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SeanceRepository extends JpaRepository<Seance, Long> {

    // toutes les séances d’un cours
    List<Seance> findByCourseId(Long courseId);

    long countByCourseId(Long courseId);
    void deleteByCourseId(Long courseId);

    List<Seance> findByStartDateTimeAfterOrderByStartDateTimeAsc(LocalDateTime after, Pageable pageable);

    /** Prochaine séance à venir pour un cours donné (métier avancé). */
    List<Seance> findFirstByCourse_IdAndStartDateTimeAfterOrderByStartDateTimeAsc(
            Long courseId, LocalDateTime after, Pageable pageable);
}
