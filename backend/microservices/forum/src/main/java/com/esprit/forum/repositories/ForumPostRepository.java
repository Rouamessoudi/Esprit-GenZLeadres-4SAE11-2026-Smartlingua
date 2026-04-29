package com.esprit.forum.repositories;

import com.esprit.forum.entities.ForumPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findAllByOrderByCreatedAtDesc();
}
