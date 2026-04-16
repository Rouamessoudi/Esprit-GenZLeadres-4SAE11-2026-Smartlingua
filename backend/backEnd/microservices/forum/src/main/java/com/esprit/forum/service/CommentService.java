package com.esprit.forum.service;

import com.esprit.forum.entity.Comment;
import com.esprit.forum.entity.ForumPost;
import com.esprit.forum.entity.NotificationType;
import com.esprit.forum.repository.CommentRepository;
import com.esprit.forum.repository.ForumPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ForumPostRepository forumPostRepository;
    private final NotificationService notificationService;

    public CommentService(CommentRepository commentRepository, ForumPostRepository forumPostRepository, NotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.forumPostRepository = forumPostRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<Comment> findByPostId(Long postId) {
        return commentRepository.findByPost_IdOrderByCreatedAtAsc(postId);
    }

    public List<Comment> findByParentCommentId(Long parentCommentId) {
        return commentRepository.findByParentComment_IdOrderByCreatedAtAsc(parentCommentId);
    }

    @Transactional(readOnly = true)
    public Optional<Comment> findById(Long id) {
        return commentRepository.findById(id);
    }

    public Comment create(Comment comment, Long postId, Long parentCommentId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Forum post not found with id: " + postId));
        comment.setPost(post);

        if (parentCommentId != null) {
            Comment parent = commentRepository.findById(parentCommentId)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found with id: " + parentCommentId));
            comment.setParentComment(parent);
        }

        Comment created = commentRepository.save(comment);

        // Notifications forum : prevenir l'auteur du post si quelqu'un d'autre commente.
        Long postOwnerId = post.getAuthorId();
        if (postOwnerId != null && !postOwnerId.equals(created.getAuthorId())) {
            notificationService.notifyUser(
                    postOwnerId,
                    "Nouveau commentaire",
                    "Un commentaire a ete ajoute a votre publication.",
                    NotificationType.COMMENT,
                    "FORUM_POST",
                    post.getId(),
                    "/forum/" + post.getId()
            );
        }

        // Reponse a un commentaire : prevenir l'auteur du commentaire parent (type REPLY).
        if (created.getParentComment() != null) {
            Long parentAuthorId = created.getParentComment().getAuthorId();
            if (parentAuthorId != null && !parentAuthorId.equals(created.getAuthorId())) {
                notificationService.notifyUser(
                        parentAuthorId,
                        "Nouvelle reponse",
                        "Quelqu'un a repondu a votre commentaire.",
                        NotificationType.REPLY,
                        "COMMENT",
                        created.getParentComment().getId(),
                        "/forum/" + post.getId()
                );
            }
        }

        return created;
    }

    public Comment update(Long id, Comment commentDetails) {
        return commentRepository.findById(id)
                .map(existing -> {
                    existing.setContent(commentDetails.getContent());
                    existing.setIsModerated(commentDetails.getIsModerated());
                    return commentRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
    }

    public Comment moderate(Long id, boolean isModerated) {
        return commentRepository.findById(id)
                .map(existing -> {
                    existing.setIsModerated(isModerated);
                    return commentRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
    }

    public void delete(Long id) {
        commentRepository.deleteById(id);
    }
}
