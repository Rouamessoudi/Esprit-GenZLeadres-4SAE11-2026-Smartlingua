package com.esprit.forum.service;

import com.esprit.forum.repository.CommentRepository;
import com.esprit.forum.repository.ForumPostRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Score d'engagement utilisateur:
 * score = likes + posts + comments
 */
@Service
public class EngagementService {

    private final PostLikeService postLikeService;
    private final ForumPostRepository forumPostRepository;
    private final CommentRepository commentRepository;

    public EngagementService(
            PostLikeService postLikeService,
            ForumPostRepository forumPostRepository,
            CommentRepository commentRepository
    ) {
        this.postLikeService = postLikeService;
        this.forumPostRepository = forumPostRepository;
        this.commentRepository = commentRepository;
    }

    public Map<String, Long> computeUserEngagement(Long userId) {
        long likes = postLikeService.countLikesByUser(userId);
        long posts = forumPostRepository.countByAuthorId(userId);
        long comments = commentRepository.countByAuthorId(userId);
        long score = likes + posts + comments;
        return Map.of(
                "userId", userId,
                "likes", likes,
                "posts", posts,
                "comments", comments,
                "score", score
        );
    }
}
