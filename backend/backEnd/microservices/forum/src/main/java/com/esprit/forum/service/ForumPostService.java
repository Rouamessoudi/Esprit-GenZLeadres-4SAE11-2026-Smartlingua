package com.esprit.forum.service;

import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.PostStatus;
import com.esprit.forum.repository.ForumPostRepository;
import com.esprit.forum.repository.PostLikeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ForumPostService {

    private final ForumPostRepository forumPostRepository;
    private final PostLikeService postLikeService;
    private final PostLikeRepository postLikeRepository;

    @Value("${likes.trending-threshold:5}")
    private long trendingThreshold;

    public ForumPostService(
            ForumPostRepository forumPostRepository,
            PostLikeService postLikeService,
            PostLikeRepository postLikeRepository
    ) {
        this.forumPostRepository = forumPostRepository;
        this.postLikeService = postLikeService;
        this.postLikeRepository = postLikeRepository;
    }

    public List<ForumPost> findAll(Long userId) {
        return findAll(userId, false);
    }

    public List<ForumPost> findAll(Long userId, boolean prioritizeByLikes) {
        List<ForumPost> posts = forumPostRepository.findAllByOrderByCreatedAtDesc();
        posts = posts.stream().filter(p -> p.getStatus() != PostStatus.REMOVED).toList();
        enrichWithLikes(posts, userId);
        if (prioritizeByLikes) {
            posts = sortByLikesPriority(posts);
        }
        return posts;
    }

    public List<ForumPost> findByCategory(String category, Long userId) {
        return findByCategory(category, userId, false);
    }

    public List<ForumPost> findByCategory(String category, Long userId, boolean prioritizeByLikes) {
        List<ForumPost> posts = forumPostRepository.findByCategoryOrderByCreatedAtDesc(category);
        posts = posts.stream().filter(p -> p.getStatus() != PostStatus.REMOVED).toList();
        enrichWithLikes(posts, userId);
        if (prioritizeByLikes) {
            posts = sortByLikesPriority(posts);
        }
        return posts;
    }

    public List<ForumPost> findFlaggedPosts() {
        List<ForumPost> posts = forumPostRepository.findByStatusOrderByCreatedAtDesc(PostStatus.FLAGGED);
        posts.forEach(p -> p.setLikesCount(postLikeService.getLikesCount(p.getId())));
        return posts;
    }

    private void enrichWithLikes(List<ForumPost> posts, Long userId) {
        for (ForumPost p : posts) {
            p.setLikesCount(postLikeService.getLikesCount(p.getId()));
            p.setTrending((p.getLikesCount() != null ? p.getLikesCount() : 0L) >= Math.max(1, trendingThreshold));
            if (userId != null) {
                p.setUserLiked(postLikeService.hasUserLiked(p.getId(), userId));
            }
        }
    }

    public Optional<ForumPost> findById(Long id) {
        return findById(id, null);
    }

    public Optional<ForumPost> findById(Long id, Long userId) {
        return forumPostRepository.findById(id)
                .map(post -> {
                    post.setLikesCount(postLikeService.getLikesCount(id));
                    post.setTrending((post.getLikesCount() != null ? post.getLikesCount() : 0L) >= Math.max(1, trendingThreshold));
                    if (userId != null) {
                        post.setUserLiked(postLikeService.hasUserLiked(id, userId));
                    }
                    return post;
                });
    }

    public ForumPost create(ForumPost post) {
        return forumPostRepository.save(post);
    }

    public ForumPost update(Long id, ForumPost postDetails) {
        return forumPostRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(postDetails.getTitle());
                    existing.setContent(postDetails.getContent());
                    existing.setCategory(postDetails.getCategory());
                    if (postDetails.getIsModerated() != null) {
                        existing.setIsModerated(postDetails.getIsModerated());
                    }
                    return forumPostRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + id));
    }

    public ForumPost moderate(Long id, boolean isModerated) {
        return forumPostRepository.findById(id)
                .map(existing -> {
                    existing.setIsModerated(isModerated);
                    return forumPostRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + id));
    }

    public ForumPost moderateStatus(Long id, PostStatus status) {
        return forumPostRepository.findById(id)
                .map(existing -> {
                    existing.setStatus(status);
                    existing.setIsModerated(status == PostStatus.ACTIVE);
                    return forumPostRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + id));
    }

    public void delete(Long id) {
        forumPostRepository.deleteById(id);
    }

    /**
     * Recommandation basique:
     * - categories des posts deja likes par l'utilisateur
     * - posts actifs/non supprimes dans ces categories
     * - exclusion des posts deja likes
     * - tri par likes puis recence
     */
    public List<ForumPost> recommendByLikes(Long userId, int limit) {
        List<Long> likedPostIds = postLikeRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(pl -> pl.getPost().getId())
                .distinct()
                .toList();
        if (likedPostIds.isEmpty()) {
            return List.of();
        }

        Set<String> likedCategories = forumPostRepository.findAllById(likedPostIds).stream()
                .map(ForumPost::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toSet());
        if (likedCategories.isEmpty()) {
            return List.of();
        }

        Set<Long> likedIdsSet = new HashSet<>(likedPostIds);
        List<ForumPost> candidates = likedCategories.stream()
                .flatMap(cat -> forumPostRepository.findByCategoryAndStatusNotOrderByCreatedAtDesc(cat, PostStatus.REMOVED).stream())
                .filter(p -> p.getId() != null && !likedIdsSet.contains(p.getId()))
                .collect(Collectors.toMap(ForumPost::getId, p -> p, (a, b) -> a))
                .values()
                .stream()
                .toList();

        enrichWithLikes(candidates, userId);
        return sortByLikesPriority(candidates).stream()
                .limit(Math.max(1, limit))
                .toList();
    }

    private List<ForumPost> sortByLikesPriority(List<ForumPost> posts) {
        return posts.stream()
                .sorted(
                        Comparator.comparing((ForumPost p) -> p.getLikesCount() != null ? p.getLikesCount() : 0L).reversed()
                                .thenComparing(ForumPost::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                )
                .toList();
    }
}
