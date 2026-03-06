package com.esprit.forum.service;

import com.esprit.forum.entity.Blog;
import com.esprit.forum.entity.Comment;
import com.esprit.forum.repository.BlogRepository;
import com.esprit.forum.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ForumService {

    private final BlogRepository blogRepository;
    private final CommentRepository commentRepository;

    public ForumService(BlogRepository blogRepository, CommentRepository commentRepository) {
        this.blogRepository = blogRepository;
        this.commentRepository = commentRepository;
    }

    // --- Posts (Blog) ---

    public List<Blog> getAllPosts() {
        return blogRepository.findByModeratedFalseOrderByCreatedAtDesc();
    }

    public List<Blog> getPostsByAuthor(Long authorId) {
        return blogRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
    }

    public Optional<Blog> getPostById(Long id) {
        return blogRepository.findById(id);
    }

    @Transactional
    public Blog createPost(Long authorId, String title, String content) {
        if (title == null || title.isBlank() || content == null || content.isBlank()) {
            throw new IllegalArgumentException("Title and content are required");
        }
        Blog blog = new Blog(authorId, title.trim(), content.trim());
        return blogRepository.save(blog);
    }

    @Transactional
    public Optional<Blog> updatePost(Long id, Long authorId, String title, String content) {
        return blogRepository.findById(id)
                .filter(b -> b.getAuthorId().equals(authorId))
                .map(b -> {
                    if (title != null && !title.isBlank()) b.setTitle(title.trim());
                    if (content != null) b.setContent(content.trim());
                    return blogRepository.save(b);
                });
    }

    @Transactional
    public boolean moderatePost(Long id, boolean moderated) {
        return blogRepository.findById(id)
                .map(b -> {
                    b.setModerated(moderated);
                    blogRepository.save(b);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public boolean deletePost(Long id, Long authorId) {
        return blogRepository.findById(id)
                .filter(b -> b.getAuthorId().equals(authorId))
                .map(b -> {
                    blogRepository.delete(b);
                    return true;
                })
                .orElse(false);
    }

    // --- Comments ---

    public List<Comment> getCommentsByPostId(Long blogId) {
        return commentRepository.findByBlogIdAndModeratedFalseOrderByCreatedAtAsc(blogId);
    }

    @Transactional
    public Comment addComment(Long blogId, Long userId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Comment content is required");
        }
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + blogId));
        Comment comment = new Comment(blog, userId, content.trim());
        return commentRepository.save(comment);
    }

    @Transactional
    public boolean moderateComment(Long id, boolean moderated) {
        return commentRepository.findById(id)
                .map(c -> {
                    c.setModerated(moderated);
                    commentRepository.save(c);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public boolean deleteComment(Long id, Long userId) {
        return commentRepository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .map(c -> {
                    commentRepository.delete(c);
                    return true;
                })
                .orElse(false);
    }
}
