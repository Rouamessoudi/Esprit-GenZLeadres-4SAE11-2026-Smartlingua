package com.esprit.courses.Repositories;

import com.esprit.courses.entities.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    List<Chapter> findByCourseIdOrderByOrderIndexAsc(Long courseId);

    long countByCourseId(Long courseId);
}
