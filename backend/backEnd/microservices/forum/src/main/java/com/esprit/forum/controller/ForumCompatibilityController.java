package com.esprit.forum.controller;

import com.esprit.forum.dto.CommentRequest;
import com.esprit.forum.dto.ForumPostRequest;
import com.esprit.forum.entity.Comment;
import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.PostStatus;
import com.esprit.forum.service.CommentService;
import com.esprit.forum.service.ContentModerationService;
import com.esprit.forum.service.ForumPostService;
import com.esprit.forum.service.RoleAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
public class ForumCompatibilityController {

    private final ForumPostService forumPostService;
    private final CommentService commentService;
    private final RoleAccessService roleAccessService;
    private final ContentModerationService contentModerationService;

    public ForumCompatibilityController(
            ForumPostService forumPostService,
            CommentService commentService,
            RoleAccessService roleAccessService,
            ContentModerationService contentModerationService
    ) {
        this.forumPostService = forumPostService;
        this.commentService = commentService;
        this.roleAccessService = roleAccessService;
        this.contentModerationService = contentModerationService;
    }

    @GetMapping("/forums")
    public ResponseEntity<List<ForumPost>> getForums(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long userId
    ) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, role);
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(forumPostService.findByCategory(category, userId));
        }
        return ResponseEntity.ok(forumPostService.findAll(userId));
    }

    @PostMapping("/forums")
    public ResponseEntity<ForumPost> createForum(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody ForumPostRequest request
    ) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, role);

        ContentModerationService.ModerationResult moderationResult =
                contentModerationService.moderate(request.getContent());

        ForumPost post = new ForumPost();
        post.setTitle(request.getTitle().trim());
        post.setContent(moderationResult.sanitizedContent());
        post.setAuthorId(request.getAuthorId());
        post.setCategory(request.getCategory().trim());
        post.setIsModerated(!moderationResult.flagged());
        post.setStatus(moderationResult.flagged() ? PostStatus.FLAGGED : PostStatus.ACTIVE);

        ForumPost created = forumPostService.create(post);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/comments")
    public ResponseEntity<Comment> createComment(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody CommentRequest request
    ) {
        roleAccessService.assertAuthenticatedForumAccess(userIdHeader, role);

        ContentModerationService.ModerationResult moderationResult =
                contentModerationService.moderate(request.getContent());

        Comment comment = new Comment();
        comment.setContent(moderationResult.sanitizedContent());
        comment.setAuthorId(request.getAuthorId());
        comment.setIsModerated(!moderationResult.flagged());

        Comment created = commentService.create(comment, request.getPostId(), request.getParentCommentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
