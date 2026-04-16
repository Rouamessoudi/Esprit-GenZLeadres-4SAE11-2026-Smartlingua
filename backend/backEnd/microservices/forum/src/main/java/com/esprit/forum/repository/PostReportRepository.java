package com.esprit.forum.repository;

import com.esprit.forum.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    List<PostReport> findByPostIdOrderByCreatedAtDesc(Long postId);
}
