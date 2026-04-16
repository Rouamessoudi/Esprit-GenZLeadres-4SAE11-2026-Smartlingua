package com.esprit.forum.repository;

import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    List<ForumPost> findByCategoryOrderByCreatedAtDesc(String category);

    List<ForumPost> findAllByOrderByCreatedAtDesc();

    List<ForumPost> findByStatusOrderByCreatedAtDesc(PostStatus status);

    List<ForumPost> findByCategoryAndStatusOrderByCreatedAtDesc(String category, PostStatus status);

    Optional<ForumPost> findFirstByAuthorIdOrderByUpdatedAtDesc(Long authorId);

    boolean existsByAuthorIdAndUpdatedAtAfter(Long authorId, LocalDateTime threshold);

    long countByAuthorId(Long authorId);

    List<ForumPost> findByCategoryAndStatusNotOrderByCreatedAtDesc(String category, PostStatus status);
}
