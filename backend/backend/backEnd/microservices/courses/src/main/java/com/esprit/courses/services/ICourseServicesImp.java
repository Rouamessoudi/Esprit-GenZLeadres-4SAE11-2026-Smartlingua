package com.esprit.courses.services;

import com.esprit.courses.DTO.CourseDto;
import com.esprit.courses.DTO.ResourceDto;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.Repositories.ResourceRepository;
import com.esprit.courses.Repositories.SeanceRepository;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.enums.CourseLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ICourseServicesImp implements ICourseServices {

    private final CourseRepository courseRepository;
    private final ResourceRepository resourceRepository;
    private final SeanceRepository seanceRepository;

    public ICourseServicesImp(
            CourseRepository courseRepository,
            ResourceRepository resourceRepository,
            SeanceRepository seanceRepository) {
        this.courseRepository = courseRepository;
        this.resourceRepository = resourceRepository;
        this.seanceRepository = seanceRepository;
    }

    @Override
    public CourseDto addCourse(CourseDto dto) {
        Course course = toEntity(dto);
        Course saved = courseRepository.save(course);
        return toDtoWithoutResources(saved);
    }

    @Override
    public CourseDto updateCourse(Long id, CourseDto dto) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setLevel(dto.getLevel());
        existing.setStartDate(dto.getStartDate());
        existing.setEndDate(dto.getEndDate());
        existing.setPrice(dto.getPrice());
        Course saved = courseRepository.save(existing);
        return toDtoWithoutResources(saved);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        // Cleanup related rows first to avoid FK violations on course deletion.
        seanceRepository.deleteByCourseId(id);
        resourceRepository.deleteByCourseId(id);
        courseRepository.deleteById(id);
    }

    @Override
    public CourseDto getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        return toDto(course);
    }

    @Override
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream().map(this::toDtoWithoutResources).collect(Collectors.toList());
    }

    @Override
    public List<CourseDto> getCoursesByLevel(CourseLevel level) {
        return courseRepository.findByLevel(level).stream().map(this::toDtoWithoutResources).collect(Collectors.toList());
    }

    @Override
    public Page<CourseDto> getCoursesPaginated(Pageable pageable, CourseLevel level) {
        if (level != null) {
            return courseRepository.findByLevel(level, pageable).map(this::toDtoWithoutResources);
        }
        return courseRepository.findAll(pageable).map(this::toDtoWithoutResources);
    }

    /** DTO sans liste resources pour éviter référence circulaire / JSON invalide */
    private CourseDto toDtoWithoutResources(Course course) {
        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setLevel(course.getLevel());
        dto.setStartDate(course.getStartDate());
        dto.setEndDate(course.getEndDate());
        dto.setPrice(course.getPrice());
        return dto;
    }

    private Course toEntity(CourseDto dto) {
        Course c = new Course();
        c.setTitle(dto.getTitle());
        c.setDescription(dto.getDescription());
        c.setLevel(dto.getLevel());
        c.setStartDate(dto.getStartDate());
        c.setEndDate(dto.getEndDate());
        c.setPrice(dto.getPrice());
        return c;
    }

    private CourseDto toDto(Course course) {
        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setLevel(course.getLevel());
        dto.setStartDate(course.getStartDate());
        dto.setEndDate(course.getEndDate());
        dto.setPrice(course.getPrice());
        if (course.getResources() != null) {
            dto.setResources(course.getResources().stream()
                    .map(this::toResourceDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private ResourceDto toResourceDto(com.esprit.courses.entities.Resource r) {
        ResourceDto dto = new ResourceDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setType(r.getType());
        dto.setUrl(r.getUrl());
        return dto;
    }
}
