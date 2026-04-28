package com.esprit.courses.services;

import com.esprit.courses.DTO.CourseSummaryDto;
import com.esprit.courses.DTO.ResourcesSummaryDto;
import com.esprit.courses.DTO.SeanceWithCourseDto;
import com.esprit.courses.DTO.SeancesSummaryDto;
import com.esprit.courses.DTO.StatisticsDto;
import com.esprit.courses.DTO.CourseCompletionDto;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.Repositories.ResourceRepository;
import com.esprit.courses.Repositories.SeanceRepository;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.Seance;
import com.esprit.courses.entities.enums.CourseLevel;
import com.esprit.courses.entities.enums.ResourceType;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StatisticsServiceImpl implements IStatisticsService {

    private final CourseRepository courseRepository;
    private final ResourceRepository resourceRepository;
    private final SeanceRepository seanceRepository;

    public StatisticsServiceImpl(CourseRepository courseRepository,
                                 ResourceRepository resourceRepository,
                                 SeanceRepository seanceRepository) {
        this.courseRepository = courseRepository;
        this.resourceRepository = resourceRepository;
        this.seanceRepository = seanceRepository;
    }

    @Override
    public StatisticsDto getStatistics() {
        StatisticsDto dto = new StatisticsDto();
        dto.setTotalCourses(courseRepository.count());
        dto.setTotalResources(resourceRepository.count());
        dto.setTotalSeances(seanceRepository.count());

        Map<CourseLevel, Long> byLevel = new LinkedHashMap<>();
        for (CourseLevel level : EnumSet.allOf(CourseLevel.class)) {
            byLevel.put(level, courseRepository.countByLevel(level));
        }
        dto.setCoursesByLevel(byLevel);

        Map<ResourceType, Long> byType = new LinkedHashMap<>();
        for (ResourceType type : EnumSet.allOf(ResourceType.class)) {
            byType.put(type, resourceRepository.countByType(type));
        }
        dto.setResourcesByType(byType);

        List<Seance> upcoming = seanceRepository.findByStartDateTimeAfterOrderByStartDateTimeAsc(
                LocalDateTime.now(), PageRequest.of(0, 500));
        long totalMinutes = upcoming.stream()
                .mapToLong(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();
        dto.setUpcomingSeancesTotalMinutes(totalMinutes);

        return dto;
    }

    @Override
    public CourseSummaryDto getCourseSummary(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));
        CourseSummaryDto dto = new CourseSummaryDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setLevel(course.getLevel());
        dto.setStartDate(course.getStartDate());
        dto.setEndDate(course.getEndDate());
        dto.setPrice(course.getPrice());
        dto.setResourceCount(resourceRepository.countByCourseId(courseId));
        dto.setSeanceCount(seanceRepository.countByCourseId(courseId));
        return dto;
    }

    @Override
    public List<SeanceWithCourseDto> getUpcomingSeances(int limit) {
        LocalDateTime now = LocalDateTime.now();
        List<Seance> seances = seanceRepository.findByStartDateTimeAfterOrderByStartDateTimeAsc(
                now, PageRequest.of(0, Math.max(1, limit)));
        return seances.stream().map(this::toSeanceWithCourseDto).collect(Collectors.toList());
    }

    @Override
    public List<CourseSummaryDto> getIncompleteCourses() {
        List<Course> all = courseRepository.findAll();
        List<CourseSummaryDto> incomplete = new ArrayList<>();
        for (Course c : all) {
            long resCount = resourceRepository.countByCourseId(c.getId());
            long seaCount = seanceRepository.countByCourseId(c.getId());
            if (resCount == 0 || seaCount == 0) {
                CourseSummaryDto dto = new CourseSummaryDto();
                dto.setId(c.getId());
                dto.setTitle(c.getTitle());
                dto.setLevel(c.getLevel());
                dto.setStartDate(c.getStartDate());
                dto.setEndDate(c.getEndDate());
                dto.setPrice(c.getPrice());
                dto.setResourceCount(resCount);
                dto.setSeanceCount(seaCount);
                incomplete.add(dto);
            }
        }
        return incomplete;
    }

    @Override
    public ResourcesSummaryDto getResourcesSummary(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Cours introuvable");
        }
        ResourcesSummaryDto dto = new ResourcesSummaryDto();
        dto.setTotal(resourceRepository.countByCourseId(courseId));
        Map<ResourceType, Long> byType = new LinkedHashMap<>();
        for (ResourceType type : EnumSet.allOf(ResourceType.class)) {
            byType.put(type, resourceRepository.countByCourseIdAndType(courseId, type));
        }
        dto.setByType(byType);
        return dto;
    }

    @Override
    public SeancesSummaryDto getSeancesSummary(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Cours introuvable");
        }
        List<Seance> all = seanceRepository.findByCourseId(courseId);
        LocalDateTime now = LocalDateTime.now();
        long upcoming = all.stream().filter(s -> s.getStartDateTime() != null && s.getStartDateTime().isAfter(now)).count();
        long totalMinutes = all.stream()
                .mapToLong(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();
        SeancesSummaryDto dto = new SeancesSummaryDto();
        dto.setTotalSeances(all.size());
        dto.setUpcomingCount(upcoming);
        dto.setTotalDurationMinutes(totalMinutes);
        return dto;
    }

    @Override
    public Optional<SeanceWithCourseDto> getNextSeanceForCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Cours introuvable");
        }
        List<Seance> next = seanceRepository.findFirstByCourse_IdAndStartDateTimeAfterOrderByStartDateTimeAsc(
                courseId, LocalDateTime.now(), PageRequest.of(0, 1));
        return next.isEmpty() ? Optional.empty() : Optional.of(toSeanceWithCourseDto(next.get(0)));
    }

    @Override
    public CourseCompletionDto getCourseCompletionStatus(Long courseId) {
        com.esprit.courses.entities.Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));
        long resCount = resourceRepository.countByCourseId(courseId);
        long seaCount = seanceRepository.countByCourseId(courseId);
        boolean hasResources = resCount > 0;
        boolean hasSeances = seaCount > 0;
        boolean complete = hasResources && hasSeances;

        CourseCompletionDto dto = new CourseCompletionDto();
        dto.setCourseId(courseId);
        dto.setCourseTitle(course.getTitle());
        dto.setHasResources(hasResources);
        dto.setHasSeances(hasSeances);
        dto.setComplete(complete);
        dto.setMessage(complete ? "Cours complet (ressources et séances définies)."
                : "À compléter : ajoutez au moins une ressource et une séance.");
        return dto;
    }

    private SeanceWithCourseDto toSeanceWithCourseDto(Seance s) {
        SeanceWithCourseDto dto = new SeanceWithCourseDto();
        dto.setId(s.getId());
        dto.setTitle(s.getTitle());
        dto.setStartDateTime(s.getStartDateTime());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setDescription(s.getDescription());
        if (s.getCourse() != null) {
            dto.setCourseId(s.getCourse().getId());
            dto.setCourseTitle(s.getCourse().getTitle());
        }
        return dto;
    }
}
