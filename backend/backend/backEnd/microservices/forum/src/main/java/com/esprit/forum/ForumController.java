package com.esprit.forum;

import com.esprit.forum.dto.AddCommentRequest;
import com.esprit.forum.dto.CreatePostRequest;
import com.esprit.forum.dto.UpdatePostRequest;
import com.esprit.forum.entity.Blog;
import com.esprit.forum.entity.Comment;
import com.esprit.forum.service.ForumService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/forum")
@CrossOrigin(originPatterns = "*")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @GetMapping
    public String sayHello() {
        return "Hello from Forum service";
    }

    // --- Posts ---

    @GetMapping("/posts")
    public List<Blog> getAllPosts() {
        return forumService.getAllPosts();
    }

    @GetMapping("/posts/author/{authorId}")
    public List<Blog> getPostsByAuthor(@PathVariable Long authorId) {
        return forumService.getPostsByAuthor(authorId);
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<Blog> getPost(@PathVariable Long id) {
        return forumService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/posts")
    public ResponseEntity<Blog> createPost(@RequestBody CreatePostRequest request) {
        if (request.getAuthorId() == null || request.getTitle() == null || request.getTitle().isBlank()
                || request.getContent() == null || request.getContent().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Blog blog = forumService.createPost(
                    request.getAuthorId(), request.getTitle(), request.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(blog);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<Blog> updatePost(@PathVariable Long id, @RequestBody UpdatePostRequest request) {
        if (request.getAuthorId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return forumService.updatePost(id, request.getAuthorId(), request.getTitle(), request.getContent())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Moderation: hide/show post. PATCH /forum/posts/{id}/moderate?moderated=true */
    @PatchMapping("/posts/{id}/moderate")
    public ResponseEntity<Void> moderatePost(@PathVariable Long id, @RequestParam boolean moderated) {
        return forumService.moderatePost(id, moderated)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, @RequestParam Long authorId) {
        return forumService.deletePost(id, authorId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // --- Comments ---

    @GetMapping("/posts/{blogId}/comments")
    public List<Comment> getComments(@PathVariable Long blogId) {
        return forumService.getCommentsByPostId(blogId);
    }

    @PostMapping("/posts/{blogId}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long blogId, @RequestBody AddCommentRequest request) {
        if (request.getUserId() == null || request.getContent() == null || request.getContent().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Comment comment = forumService.addComment(blogId, request.getUserId(), request.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(comment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/comments/{id}/moderate")
    public ResponseEntity<Void> moderateComment(@PathVariable Long id, @RequestParam boolean moderated) {
        return forumService.moderateComment(id, moderated)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @RequestParam Long userId) {
        return forumService.deleteComment(id, userId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
