package com.esprit.forum.repository;

import com.esprit.forum.model.ForumPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findAllByOrderByCreatedAtDesc();
}
