package com.esprit.forum.controller;

import com.esprit.forum.dto.CommentRequest;
import com.esprit.forum.dto.CommentUpdateRequest;
import com.esprit.forum.entity.Comment;
import com.esprit.forum.service.CommentService;
import com.esprit.forum.service.RoleAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forum/comments")
public class CommentController {

    private final CommentService commentService;
    private final RoleAccessService roleAccessService;

    public CommentController(CommentService commentService, RoleAccessService roleAccessService) {
        this.commentService = commentService;
        this.roleAccessService = roleAccessService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<Comment>> getCommentsByPostId(
            @PathVariable Long postId,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        return ResponseEntity.ok(commentService.findByPostId(postId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> getCommentById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        return commentService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @Valid @RequestBody CommentRequest request) {
        roleAccessService.assertAuthenticated(userIdHeader);
        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setAuthorId(request.getAuthorId());
        Comment created = commentService.create(comment, request.getPostId(), request.getParentCommentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comment> updateComment(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @Valid @RequestBody CommentUpdateRequest request) {
        roleAccessService.assertAuthenticated(userIdHeader);
        try {
            Comment comment = new Comment();
            comment.setContent(request.getContent());
            Comment updated = commentService.update(id, comment);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/moderate")
    public ResponseEntity<Comment> moderateComment(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestParam boolean moderated) {
        roleAccessService.assertAuthenticated(userIdHeader);
        try {
            Comment updated = commentService.moderate(id, moderated);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader) {
        roleAccessService.assertAuthenticated(userIdHeader);
        try {
            commentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
