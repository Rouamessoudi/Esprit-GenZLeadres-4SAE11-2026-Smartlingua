package com.esprit.courses.controllers;

import com.esprit.courses.DTO.CourseDto;
import com.esprit.courses.entities.enums.CourseLevel;
import com.esprit.courses.services.ICourseServices;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class CourseController {

    private final ICourseServices courseServices;

    public CourseController(ICourseServices courseServices) {
        this.courseServices = courseServices;
    }

    @PostMapping
    public CourseDto create(@Valid @RequestBody CourseDto dto) {
        return courseServices.addCourse(dto);
    }

    @PutMapping("/{id}")
    public CourseDto update(@PathVariable Long id, @Valid @RequestBody CourseDto dto) {
        return courseServices.updateCourse(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        courseServices.deleteCourse(id);
    }

    @GetMapping("/{id}")
    public CourseDto getById(@PathVariable Long id) {
        return courseServices.getCourseById(id);
    }

    @GetMapping
    public List<CourseDto> getAll(@RequestParam(required = false) CourseLevel level) {
        if (level != null) {
            return courseServices.getCoursesByLevel(level);
        }
        return courseServices.getAllCourses();
    }

    /** Liste paginée (pour back office et front office). Paramètres : page (0-based), size, level (optionnel). */
    @GetMapping("/paged")
    public Page<CourseDto> getAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) CourseLevel level) {
        Pageable pageable = PageRequest.of(page, size);
        return courseServices.getCoursesPaginated(pageable, level);
    }
}
