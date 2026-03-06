package com.esprit.forum.repository;

import com.esprit.forum.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByBlogIdAndModeratedFalseOrderByCreatedAtAsc(Long blogId);
}
