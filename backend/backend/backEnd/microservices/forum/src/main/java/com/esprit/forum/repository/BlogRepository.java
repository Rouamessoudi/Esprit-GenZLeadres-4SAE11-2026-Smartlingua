package com.esprit.forum.repository;

import com.esprit.forum.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {

    /** List all posts not moderated, newest first. */
    List<Blog> findByModeratedFalseOrderByCreatedAtDesc();

    /** List all posts by author. */
    List<Blog> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}
