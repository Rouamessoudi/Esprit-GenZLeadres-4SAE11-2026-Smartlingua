package com.esprit.forum.service;

import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.PostLike;
import com.esprit.forum.repository.ForumPostRepository;
import com.esprit.forum.repository.PostLikeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;
    private final ForumPostRepository forumPostRepository;

    @Value("${likes.rate-limit.max-actions:8}")
    private int maxLikeActionsPerWindow;

    @Value("${likes.rate-limit.window-seconds:30}")
    private int likeRateWindowSeconds;

    /** Buffer en memoire pour limiter le spam d'actions like/unlike. */
    private final Map<Long, Deque<Long>> actionTimestampsByUser = new ConcurrentHashMap<>();

    public PostLikeService(PostLikeRepository postLikeRepository, ForumPostRepository forumPostRepository) {
        this.postLikeRepository = postLikeRepository;
        this.forumPostRepository = forumPostRepository;
    }

    @Transactional
    public boolean like(Long postId, Long userId) {
        ensureLikeRateLimit(userId);
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + postId));
        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            return false; // déjà liké
        }
        PostLike like = new PostLike();
        like.setPost(post);
        like.setUserId(userId);
        postLikeRepository.save(like);
        return true;
    }

    @Transactional
    public boolean unlike(Long postId, Long userId) {
        ensureLikeRateLimit(userId);
        forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + postId));
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            return false;
        }
        postLikeRepository.deleteByPostIdAndUserId(postId, userId);
        return true;
    }

    public long getLikesCount(Long postId) {
        return postLikeRepository.countByPostId(postId);
    }

    public boolean hasUserLiked(Long postId, Long userId) {
        return postLikeRepository.existsByPostIdAndUserId(postId, userId);
    }

    public long countLikesByUser(Long userId) {
        return postLikeRepository.countByUserId(userId);
    }

    private void ensureLikeRateLimit(Long userId) {
        int windowMillis = Math.max(5, likeRateWindowSeconds) * 1000;
        int maxActions = Math.max(1, maxLikeActionsPerWindow);
        long now = System.currentTimeMillis();
        long cutoff = now - windowMillis;

        Deque<Long> deque = actionTimestampsByUser.computeIfAbsent(userId, ignored -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && deque.peekFirst() < cutoff) {
                deque.pollFirst();
            }
            if (deque.size() >= maxActions) {
                throw new RuntimeException("Trop d'actions like/unlike en peu de temps. Veuillez patienter.");
            }
            deque.addLast(now);
        }
    }
}
