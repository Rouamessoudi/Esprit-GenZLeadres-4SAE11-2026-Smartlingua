package com.esprit.forum;

import com.esprit.forum.dto.AnnouncementRequest;
import com.esprit.forum.model.Announcement;
import com.esprit.forum.repository.AnnouncementRepository;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(
    originPatterns = {"http://localhost:*", "http://127.0.0.1:*"},
    allowedHeaders = "*",
    methods = {
        org.springframework.web.bind.annotation.RequestMethod.GET,
        org.springframework.web.bind.annotation.RequestMethod.POST,
        org.springframework.web.bind.annotation.RequestMethod.PUT,
        org.springframework.web.bind.annotation.RequestMethod.DELETE,
        org.springframework.web.bind.annotation.RequestMethod.OPTIONS
    }
)
@RequestMapping({"/api/announcements", "/forum/announcements"})
public class AnnouncementController {
    private static final Pattern KEYCLOAK_UUID = Pattern.compile("^[0-9a-fA-F-]{36}$");

    private final AnnouncementRepository announcementRepository;
    private final RestClient usersClient;

    public AnnouncementController(
        AnnouncementRepository announcementRepository,
        RestClient.Builder restClientBuilder,
        @Value("${users.service.base-url:http://localhost:8087}") String usersBaseUrl
    ) {
        this.announcementRepository = announcementRepository;
        this.usersClient = restClientBuilder.baseUrl(usersBaseUrl).build();
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public List<AnnouncementResponse> getAll() {
        return announcementRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::enrichAuthorForResponse)
            .map(this::toResponse)
            .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public AnnouncementResponse getById(@PathVariable Long id) {
        Announcement announcement = announcementRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
        return toResponse(enrichAuthorForResponse(announcement));
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public AnnouncementResponse create(@RequestBody AnnouncementRequest request, Authentication authentication) {
        Announcement announcement = new Announcement();
        announcement.setTitle(request.title());
        announcement.setContent(request.content());
        String keycloakId = resolveKeycloakId(authentication);
        String username = resolveAppUsernameByKeycloakId(keycloakId);
        announcement.setAuthorKeycloakId(keycloakId);
        announcement.setAuthorUsername(username);
        announcement.setAuthorName(username);
        announcement.setAuthor(username);
        return toResponse(enrichAuthorForResponse(announcementRepository.save(announcement)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public AnnouncementResponse update(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        Announcement existing = announcementRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
        existing.setTitle(request.title());
        existing.setContent(request.content());
        return toResponse(enrichAuthorForResponse(announcementRepository.save(existing)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public void delete(@PathVariable Long id) {
        if (!announcementRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
        }
        announcementRepository.deleteById(id);
    }

    private String resolveKeycloakId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return trimToNull(jwt.getClaimAsString("sub"));
        }
        return null;
    }

    private Announcement enrichAuthorForResponse(Announcement announcement) {
        if (announcement == null) {
            return null;
        }
        String keycloakId = trimToNull(announcement.getAuthorKeycloakId());
        if (keycloakId == null && isLikelyKeycloakId(announcement.getAuthor())) {
            keycloakId = announcement.getAuthor();
            announcement.setAuthorKeycloakId(keycloakId);
        }
        String username = trimToNull(announcement.getAuthorUsername());
        if (username == null && keycloakId != null) {
            username = resolveAppUsernameByKeycloakId(keycloakId);
        }
        announcement.setAuthorUsername(username);
        announcement.setAuthorName(username);
        announcement.setAuthor(username);
        return announcement;
    }

    private String resolveAppUsernameByKeycloakId(String keycloakId) {
        if (keycloakId == null || keycloakId.isBlank()) {
            return null;
        }
        try {
            UserLookup user = usersClient.get()
                .uri("/api/users/keycloak/{id}", keycloakId)
                .retrieve()
                .body(UserLookup.class);
            if (user != null) {
                return trimToNull(user.username());
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private boolean isLikelyKeycloakId(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        return KEYCLOAK_UUID.matcher(value).matches();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        return new AnnouncementResponse(
            announcement.getId(),
            announcement.getTitle(),
            announcement.getContent(),
            announcement.getAuthorUsername(),
            announcement.getAuthorName(),
            announcement.getCreatedAt()
        );
    }

    private record UserLookup(String username) {}

    private record AnnouncementResponse(
        Long id,
        String title,
        String content,
        String authorUsername,
        String authorName,
        java.time.LocalDateTime createdAt
    ) {}
}
