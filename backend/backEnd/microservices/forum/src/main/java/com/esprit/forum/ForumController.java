package com.esprit.forum;

import com.esprit.forum.dto.ForumPostRequest;
import com.esprit.forum.dto.LikeRequest;
import com.esprit.forum.dto.ModerateRequest;
import com.esprit.forum.dto.ReportRequest;
import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.service.ForumPostService;
import com.esprit.forum.service.EngagementService;
import com.esprit.forum.service.PostLikeService;
import com.esprit.forum.service.PostReportService;
import com.esprit.forum.service.RoleAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/forum")
public class ForumController {

    private final ForumPostService forumPostService;
    private final EngagementService engagementService;
    private final PostLikeService postLikeService;
    private final PostReportService postReportService;
    private final RoleAccessService roleAccessService;

    public ForumController(
            ForumPostService forumPostService,
            EngagementService engagementService,
            PostLikeService postLikeService,
            PostReportService postReportService,
            RoleAccessService roleAccessService
    ) {
        this.forumPostService = forumPostService;
        this.engagementService = engagementService;
        this.postLikeService = postLikeService;
        this.postReportService = postReportService;
        this.roleAccessService = roleAccessService;
    }

    @GetMapping
    public Map<String, String> getForumInfo() {
        return Map.of(
                "service", "Forum - Communication, Announcements, and Forum Module",
                "endpoints", "announcements, posts, comments"
        );
    }

    @GetMapping(value = {"/posts", "/posts/"})
    public ResponseEntity<List<ForumPost>> getAllPosts(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false, defaultValue = "false") boolean prioritizeByLikes) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, roleHeader);
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(forumPostService.findByCategory(category, userId, prioritizeByLikes));
        }
        return ResponseEntity.ok(forumPostService.findAll(userId, prioritizeByLikes));
    }

    @GetMapping("/posts/trending")
    public ResponseEntity<List<ForumPost>> getTrendingPosts(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) Long userId) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, roleHeader);
        List<ForumPost> sorted = forumPostService.findAll(userId, true);
        List<ForumPost> trending = sorted.stream().filter(p -> Boolean.TRUE.equals(p.getTrending())).toList();
        return ResponseEntity.ok(trending);
    }

    @GetMapping("/posts/recommendations")
    public ResponseEntity<List<ForumPost>> getRecommendations(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false, defaultValue = "8") int limit) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, roleHeader);
        Long effectiveUserId = userId != null ? userId : userIdHeader;
        return ResponseEntity.ok(forumPostService.recommendByLikes(effectiveUserId, limit));
    }

    @GetMapping("/engagement/score")
    public ResponseEntity<Map<String, Long>> getEngagementScore(
            @RequestParam Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId) {
        if (requesterId == null || !requesterId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces non autorise au score d'engagement.");
        }
        return ResponseEntity.ok(engagementService.computeUserEngagement(userId));
    }

    @GetMapping("/posts/flagged")
    public ResponseEntity<List<ForumPost>> getFlaggedPosts() {
        return ResponseEntity.ok(forumPostService.findFlaggedPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ForumPost> getPostById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) Long userId) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, roleHeader);
        return forumPostService.findById(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/posts")
    public ResponseEntity<ForumPost> createPost(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody ForumPostRequest request) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, roleHeader);
        ForumPost post = new ForumPost();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setAuthorId(request.getAuthorId());
        post.setCategory(request.getCategory());
        ForumPost created = forumPostService.create(post);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<ForumPost> updatePost(@PathVariable Long id, @Valid @RequestBody ForumPostRequest request) {
        try {
            ForumPost post = new ForumPost();
            post.setTitle(request.getTitle());
            post.setContent(request.getContent());
            post.setAuthorId(request.getAuthorId());
            post.setCategory(request.getCategory());
            ForumPost updated = forumPostService.update(id, post);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/posts/{id}/moderate")
    public ResponseEntity<ForumPost> moderatePost(@PathVariable Long id, @RequestParam boolean moderated) {
        try {
            ForumPost updated = forumPostService.moderate(id, moderated);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/posts/{id}/moderate")
    public ResponseEntity<ForumPost> moderatePostStatus(@PathVariable Long id, @Valid @RequestBody ModerateRequest request) {
        try {
            ForumPost updated = forumPostService.moderateStatus(id, request.getStatus());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/posts/{id}/report")
    public ResponseEntity<?> reportPost(@PathVariable Long id, @Valid @RequestBody ReportRequest request) {
        roleAccessService.assertAuthenticated(request.getReporterId());
        try {
            postReportService.report(id, request.getReporterId(), request.getReason());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Post reported successfully"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("already reported")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);

        ForumPost post = forumPostService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post introuvable"));

        boolean isAdmin = roleHeader != null && roleHeader.trim().equalsIgnoreCase("ADMIN");
        boolean isOwner = post.getAuthorId() != null && post.getAuthorId().equals(userIdHeader);
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'etes pas autorise a supprimer ce post");
        }

        forumPostService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable Long id, @Valid @RequestBody LikeRequest request) {
        roleAccessService.assertAuthenticated(request.getUserId());
        try {
            boolean added = postLikeService.like(id, request.getUserId());
            long count = postLikeService.getLikesCount(id);
            return ResponseEntity.ok(Map.of("likesCount", count, "liked", added));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Trop d'actions")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/posts/{id}/like")
    public ResponseEntity<Map<String, Object>> unlikePost(@PathVariable Long id, @RequestParam Long userId) {
        roleAccessService.assertAuthenticated(userId);
        try {
            postLikeService.unlike(id, userId);
            long count = postLikeService.getLikesCount(id);
            return ResponseEntity.ok(Map.of("likesCount", count, "liked", false));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Trop d'actions")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/posts/{id}/likes-count")
    public ResponseEntity<Map<String, Long>> getLikesCount(@PathVariable Long id) {
        return forumPostService.findById(id)
                .map(post -> ResponseEntity.ok(Map.of("likesCount", postLikeService.getLikesCount(id))))
                .orElse(ResponseEntity.notFound().build());
    }
}
