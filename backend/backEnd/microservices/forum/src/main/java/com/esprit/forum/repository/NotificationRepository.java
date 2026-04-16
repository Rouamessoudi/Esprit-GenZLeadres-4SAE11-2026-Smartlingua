package com.esprit.forum.repository;

import com.esprit.forum.entity.Notification;
import com.esprit.forum.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/** Acces base : requetes par utilisateur, non lues, filtre par type, comptage badge. */
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);
    List<Notification> findByUserIdAndPriorityOrderByCreatedAtDesc(Long userId, String priority);
    List<Notification> findByUserIdAndTypeAndPriorityOrderByCreatedAtDesc(Long userId, NotificationType type, String priority);
    long countByUserIdAndIsReadFalse(Long userId);
    boolean existsByUserIdAndSourceTypeAndCreatedAtAfter(Long userId, String sourceType, LocalDateTime createdAt);
}
