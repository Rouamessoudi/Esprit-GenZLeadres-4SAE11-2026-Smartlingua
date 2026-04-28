package com.esprit.users.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AdminDtos {
    private AdminDtos() {}

    public record AdminDashboardStatsDto(
        long totalStudents,
        long totalTeachers,
        long totalUsers,
        long activeCourses,
        long quizzesTaken,
        long enrollments
    ) {}

    public record EnrollmentByMonthDto(
        String month,
        long count
    ) {}

    public record AdminUserViewDto(
        Long id,
        String keycloakId,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean enabled,
        boolean deleted,
        Instant createdAt
    ) {}

    public record UpdateRoleRequest(String role) {}

    public record CoursesStatsResponse(long totalCourses) {}
    public record QuizStatsResponse(long quizzesTaken) {}
    public record AdaptiveStatsResponse(long enrollments, List<Map<String, Object>> byMonth) {}
}
