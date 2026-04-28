package com.esprit.users;

import com.esprit.users.dto.AdminDtos.AdaptiveStatsResponse;
import com.esprit.users.dto.AdminDtos.AdminDashboardStatsDto;
import com.esprit.users.dto.AdminDtos.AdminUserViewDto;
import com.esprit.users.dto.AdminDtos.CoursesStatsResponse;
import com.esprit.users.dto.AdminDtos.EnrollmentByMonthDto;
import com.esprit.users.dto.AdminDtos.QuizStatsResponse;
import com.esprit.users.dto.AdminDtos.UpdateRoleRequest;
import com.esprit.users.entities.User;
import com.esprit.users.services.UserService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    private final RestClient coursesClient;
    private final RestClient quizClient;
    private final RestClient adaptiveClient;

    public AdminController(
        UserService userService,
        RestClient.Builder restClientBuilder,
        @Value("${courses.service.base-url:http://localhost:8086}") String coursesBaseUrl,
        @Value("${quiz.service.base-url:http://localhost:8088}") String quizBaseUrl,
        @Value("${adaptive.service.base-url:http://localhost:8094}") String adaptiveBaseUrl
    ) {
        this.userService = userService;
        this.coursesClient = restClientBuilder.baseUrl(coursesBaseUrl).build();
        this.quizClient = restClientBuilder.baseUrl(quizBaseUrl).build();
        this.adaptiveClient = restClientBuilder.baseUrl(adaptiveBaseUrl).build();
    }

    @GetMapping("/dashboard/stats")
    public AdminDashboardStatsDto dashboardStats() {
        long activeCourses = fetchActiveCourses();
        long quizzesTaken = fetchQuizzesTaken();
        long enrollments = fetchEnrollments();

        return new AdminDashboardStatsDto(
            userService.countStudents(),
            userService.countTeachers(),
            userService.countUsers(),
            activeCourses,
            quizzesTaken,
            enrollments
        );
    }

    @GetMapping("/dashboard/enrollments-by-month")
    public List<EnrollmentByMonthDto> enrollmentsByMonth() {
        AdaptiveStatsResponse response = fetchAdaptiveStats();
        List<EnrollmentByMonthDto> out = new ArrayList<>();
        if (response != null && response.byMonth() != null) {
            for (Map<String, Object> item : response.byMonth()) {
                String month = String.valueOf(item.getOrDefault("month", ""));
                long count = toLong(item.get("count"));
                out.add(new EnrollmentByMonthDto(month, count));
            }
        }
        return out;
    }

    @GetMapping("/dashboard/courses")
    public List<Map<String, Object>> dashboardCourses() {
        try {
            return coursesClient.get().uri("/api/courses").retrieve().body(List.class);
        } catch (Exception ex) {
            return List.of();
        }
    }

    @GetMapping("/users")
    public List<AdminUserViewDto> adminUsers(
        @RequestParam(required = false) String role,
        @RequestParam(required = false, name = "q") String query
    ) {
        return userService.searchAdminUsers(role, query).stream().map(this::toDto).toList();
    }

    @DeleteMapping("/users/{id}")
    public AdminUserViewDto deleteUser(@PathVariable Long id, Authentication authentication) {
        User actor = userService.findByKeycloakId(currentSubject(authentication)).orElse(null);
        if (actor != null && actor.getId().equals(id)) {
            throw new IllegalArgumentException("Suppression de son propre compte interdite");
        }
        User target = userService.findById(id).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        if ("ADMIN".equalsIgnoreCase(target.getRole())) {
            throw new IllegalArgumentException("Suppression d'un admin non autorisee");
        }
        return toDto(userService.softDeleteUser(id));
    }

    @PutMapping("/users/{id}/role")
    public AdminUserViewDto updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request, Authentication authentication) {
        User actor = userService.findByKeycloakId(currentSubject(authentication)).orElse(null);
        if (actor != null && actor.getId().equals(id)) {
            throw new IllegalArgumentException("Modification de son propre role interdite");
        }
        User target = userService.findById(id).orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));
        if ("ADMIN".equalsIgnoreCase(target.getRole())) {
            throw new IllegalArgumentException("Modification role admin non autorisee");
        }
        return toDto(userService.updateRole(id, request.role()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    private String currentSubject(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        }
        return "";
    }

    private long fetchActiveCourses() {
        try {
            CoursesStatsResponse response = coursesClient.get().uri("/api/metier/statistics").retrieve().body(CoursesStatsResponse.class);
            return response != null ? response.totalCourses() : 0;
        } catch (Exception ex) {
            return 0;
        }
    }

    private long fetchQuizzesTaken() {
        try {
            QuizStatsResponse response = quizClient.get().uri("/api/quiz/admin/stats/attempts-count").retrieve().body(QuizStatsResponse.class);
            return response != null ? response.quizzesTaken() : 0;
        } catch (Exception ex) {
            return 0;
        }
    }

    private long fetchEnrollments() {
        AdaptiveStatsResponse response = fetchAdaptiveStats();
        return response != null ? response.enrollments() : 0;
    }

    private AdaptiveStatsResponse fetchAdaptiveStats() {
        try {
            return adaptiveClient.get().uri("/api/adaptive/admin/stats/enrollments").retrieve().body(AdaptiveStatsResponse.class);
        } catch (Exception ex) {
            return null;
        }
    }

    private long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ex) {
            return 0;
        }
    }

    private AdminUserViewDto toDto(User user) {
        return new AdminUserViewDto(
            user.getId(),
            user.getKeycloakId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.isEnabled(),
            user.isDeleted(),
            user.getCreatedAt()
        );
    }
}
