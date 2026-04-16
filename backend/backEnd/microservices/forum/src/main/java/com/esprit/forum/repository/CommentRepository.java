package com.esprit.forum.repository;

import com.esprit.forum.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPost_IdOrderByCreatedAtAsc(Long postId);

    List<Comment> findByParentComment_IdOrderByCreatedAtAsc(Long parentCommentId);

    Optional<Comment> findFirstByAuthorIdOrderByUpdatedAtDesc(Long authorId);

    boolean existsByAuthorIdAndUpdatedAtAfter(Long authorId, LocalDateTime threshold);

    long countByAuthorId(Long authorId);
}
