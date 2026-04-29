package com.esprit.forum.controllers;

import com.esprit.forum.entities.ForumPost;
import com.esprit.forum.repositories.ForumPostRepository;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.client.RestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping("/forum")
public class ForumController {
    private static final Pattern KEYCLOAK_UUID = Pattern.compile("^[0-9a-fA-F-]{36}$");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");

    private final ForumPostRepository forumPostRepository;
    private final RestClient usersClient;

    public ForumController(
        ForumPostRepository forumPostRepository,
        RestClient.Builder restClientBuilder,
        @Value("${users.service.base-url:http://localhost:8087}") String usersBaseUrl
    ) {
        this.forumPostRepository = forumPostRepository;
        this.usersClient = restClientBuilder.baseUrl(usersBaseUrl).build();
    }

    @GetMapping
    public String sayHello() {
        return "Hello from Forum service";
    }

    @GetMapping("/posts")
    @PreAuthorize("permitAll()")
    public List<ForumPostResponse> getPosts() {
        return forumPostRepository
            .findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::enrichAuthorForResponse)
            .map(this::toResponse)
            .toList();
    }

    @GetMapping("/posts/{id}")
    @PreAuthorize("permitAll()")
    public ForumPostResponse getPostById(@PathVariable Long id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return toResponse(enrichAuthorForResponse(post));
    }

    @PostMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    public ForumPostResponse createPost(@RequestBody ForumPost post, Authentication authentication) {
        validatePostPayload(post);
        String keycloakId = resolveKeycloakId(authentication);
        String requestedAuthor = post == null ? null : trimToNull(post.getAuthor());
        String authName = resolveAuthenticationName(authentication);
        String resolvedAuthor = firstNonBlank(
            resolveAppUsernameByKeycloakId(keycloakId),
            requestedAuthor,
            authName,
            "anonymous"
        );

        post.setAuthorKeycloakId(keycloakId);
        post.setAuthorUsername(resolvedAuthor);
        post.setAuthorName(resolvedAuthor);
        post.setAuthor(resolvedAuthor);
        return toResponse(enrichAuthorForResponse(forumPostRepository.save(post)));
    }

    @PostMapping("/posts/{id}/moderate")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ForumPostResponse moderatePost(@PathVariable Long id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        post.setModerated(true);
        return toResponse(enrichAuthorForResponse(forumPostRepository.save(post)));
    }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public void deletePost(@PathVariable Long id) {
        if (!forumPostRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
        forumPostRepository.deleteById(id);
    }

    @PutMapping("/posts/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ForumPostResponse updatePost(@PathVariable Long id, @RequestBody ForumPost requestBody) {
        validatePostPayload(requestBody);
        ForumPost existing = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        existing.setTitle(requestBody.getTitle());
        existing.setContent(requestBody.getContent());
        return toResponse(enrichAuthorForResponse(forumPostRepository.save(existing)));
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

    private String resolveAuthenticationName(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        return trimToNull(authentication.getName());
    }

    private ForumPost enrichAuthorForResponse(ForumPost post) {
        if (post == null) {
            return null;
        }
        String username = trimToNull(post.getAuthorUsername());
        String keycloakId = trimToNull(post.getAuthorKeycloakId());
        if (keycloakId == null && isLikelyKeycloakId(post.getAuthor())) {
            keycloakId = post.getAuthor();
        }
        if (username == null && keycloakId != null) {
            username = resolveAppUsernameByKeycloakId(keycloakId);
        }
        post.setAuthorKeycloakId(keycloakId);
        post.setAuthorUsername(username);
        post.setAuthorName(username);
        post.setAuthor(username);
        return post;
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
        if (!KEYCLOAK_UUID.matcher(value).matches()) {
            return false;
        }
        return true;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            String normalized = trimToNull(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private void validatePostPayload(ForumPost post) {
        if (post == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        String title = trimToNull(post.getTitle());
        if (title == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (title.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must contain at least 4 characters");
        }
        if (DIGIT_PATTERN.matcher(title).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must not contain digits");
        }
        if (trimToNull(post.getContent()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content is required");
        }
    }

    private record UserLookup(
        String username
    ) {}

    private ForumPostResponse toResponse(ForumPost post) {
        return new ForumPostResponse(
            post.getId(),
            post.getTitle(),
            post.getContent(),
            post.getAuthorUsername(),
            post.getCreatedAt(),
            post.isModerated()
        );
    }

    private record ForumPostResponse(
        Long id,
        String title,
        String content,
        String authorUsername,
        java.time.LocalDateTime createdAt,
        boolean moderated
    ) {}
}
