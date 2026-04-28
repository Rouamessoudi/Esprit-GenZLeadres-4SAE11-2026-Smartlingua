package com.esprit.courses.services;

import com.esprit.courses.DTO.CourseDto;
import com.esprit.courses.entities.enums.CourseLevel;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ICourseServices {

    CourseDto addCourse(CourseDto dto);

    CourseDto updateCourse(Long id, CourseDto dto);

    void deleteCourse(Long id);

    CourseDto getCourseById(Long id);

    List<CourseDto> getAllCourses();

    List<CourseDto> getCoursesByLevel(CourseLevel level);

    /** Pagination : tous les cours ou filtrés par niveau */
    Page<CourseDto> getCoursesPaginated(Pageable pageable, CourseLevel level);
}
