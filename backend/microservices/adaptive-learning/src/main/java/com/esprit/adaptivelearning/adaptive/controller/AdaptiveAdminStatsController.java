package com.esprit.adaptivelearning.adaptive.controller;

import com.esprit.adaptivelearning.entities.enums.EnrollmentStatus;
import com.esprit.adaptivelearning.repositories.StudentCourseEnrollmentRepository;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/adaptive/admin/stats")
public class AdaptiveAdminStatsController {
    private final StudentCourseEnrollmentRepository enrollmentRepository;

    public AdaptiveAdminStatsController(StudentCourseEnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    @GetMapping("/enrollments")
    public EnrollmentStatsResponse enrollments() {
        long total = enrollmentRepository.countByStatus(EnrollmentStatus.ACTIVE);
        List<Map<String, Object>> byMonth = enrollmentRepository.countActiveByMonth().stream()
            .map(row -> Map.<String, Object>of("month", row.getMonth(), "count", row.getCount()))
            .toList();
        return new EnrollmentStatsResponse(total, byMonth);
    }

    public record EnrollmentStatsResponse(long enrollments, List<Map<String, Object>> byMonth) {}
}
