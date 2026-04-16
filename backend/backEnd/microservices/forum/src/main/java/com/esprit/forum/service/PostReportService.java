package com.esprit.forum.service;

import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.PostReport;
import com.esprit.forum.entity.PostStatus;
import com.esprit.forum.repository.ForumPostRepository;
import com.esprit.forum.repository.PostReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostReportService {

    private final PostReportRepository postReportRepository;
    private final ForumPostRepository forumPostRepository;

    public PostReportService(PostReportRepository postReportRepository, ForumPostRepository forumPostRepository) {
        this.postReportRepository = postReportRepository;
        this.forumPostRepository = forumPostRepository;
    }

    @Transactional
    public PostReport report(Long postId, Long reporterId, String reason) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + postId));
        if (postReportRepository.existsByPostIdAndReporterId(postId, reporterId)) {
            throw new RuntimeException("Post already reported by this user");
        }
        PostReport report = new PostReport();
        report.setPost(post);
        report.setReporterId(reporterId);
        report.setReason(reason != null ? reason.trim() : null);
        postReportRepository.save(report);
        post.setStatus(PostStatus.FLAGGED);
        forumPostRepository.save(post);
        return report;
    }
}
