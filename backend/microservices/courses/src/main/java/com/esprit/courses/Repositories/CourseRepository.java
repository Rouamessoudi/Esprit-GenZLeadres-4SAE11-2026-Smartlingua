package com.esprit.courses.Repositories;

import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.enums.CourseLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByLevel(CourseLevel level);

    Page<Course> findByLevel(CourseLevel level, Pageable pageable);

    long countByLevel(CourseLevel level);
}
