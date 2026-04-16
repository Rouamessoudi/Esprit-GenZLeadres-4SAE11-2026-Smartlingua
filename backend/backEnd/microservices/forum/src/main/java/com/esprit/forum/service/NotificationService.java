package com.esprit.forum.service;

import com.esprit.forum.dto.NotificationRequest;
import com.esprit.forum.entity.Notification;
import com.esprit.forum.entity.NotificationPriority;
import com.esprit.forum.entity.NotificationType;
import com.esprit.forum.repository.CommentRepository;
import com.esprit.forum.repository.ForumPostRepository;
import com.esprit.forum.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier du module Notifications : CRUD en base, regles anti-doublon,
 * envoi cible (un user) ou broadcast (tous sauf auteur) pour les annonces.
 * Appelle le microservice users (liste des ids) de facon optionnelle : en cas d'erreur reseau,
 * les annonces/commentaires continuent de fonctionner sans planter.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ForumPostRepository forumPostRepository;
    private final CommentRepository commentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    /** GET JSON liste utilisateurs — configurable dans application.properties (users.service.url). */
    @Value("${users.service.url:http://localhost:8087/api/users}")
    private String usersServiceUrl;

    /** Jours d'inactivite avant rappel automatique. */
    @Value("${notifications.inactivity-days:3}")
    private int inactivityDays;

    public NotificationService(
            NotificationRepository notificationRepository,
            ForumPostRepository forumPostRepository,
            CommentRepository commentRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.forumPostRepository = forumPostRepository;
        this.commentRepository = commentRepository;
    }

    /** Cree une notification et l'enregistre en MySQL (toujours non lue a la creation). */
    public Notification create(NotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setTitle(request.getTitle().trim());
        notification.setMessage(request.getMessage().trim());
        notification.setType(request.getType());
        notification.setSourceType(request.getSourceType());
        notification.setSourceId(request.getSourceId());
        notification.setPriority(resolvePriority(request.getPriority(), request.getType(), request.getTriggerType()));
        notification.setTriggerType(request.getTriggerType());
        notification.setActionUrl(request.getActionUrl());
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    /** Liste pour un user : toutes, ou seulement non lues, ou filtres par type/priorite. */
    public List<Notification> getNotifications(Long userId, Boolean unreadOnly, NotificationType type, String priority) {
        String normalizedPriority = normalizePriority(priority);
        if (Boolean.TRUE.equals(unreadOnly)) {
            List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
            if (normalizedPriority == null) {
                return unread;
            }
            return unread.stream()
                    .filter(n -> normalizedPriority.equals(normalizePriority(n.getPriority())))
                    .toList();
        }
        if (type != null && normalizedPriority != null) {
            return notificationRepository.findByUserIdAndTypeAndPriorityOrderByCreatedAtDesc(userId, type, normalizedPriority);
        }
        if (type != null) {
            return notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);
        }
        if (normalizedPriority != null) {
            return notificationRepository.findByUserIdAndPriorityOrderByCreatedAtDesc(userId, normalizedPriority);
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** Utilise par le badge Angular (navbar). */
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Notification markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable."));
        ensureOwner(notification, userId);
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    public void delete(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable."));
        ensureOwner(notification, userId);
        notificationRepository.delete(notification);
    }

    /**
     * Apres creation d'une annonce : notifier chaque utilisateur connu (sauf l'auteur de l'annonce).
     */
    public void notifyAllUsersExcept(Long excludedUserId, String title, String message, NotificationType type, String sourceType, Long sourceId, String actionUrl) {
        List<Long> ids = fetchAllUserIds();
        for (Long userId : ids) {
            if (userId == null || Objects.equals(userId, excludedUserId)) {
                continue;
            }
            createIfNotDuplicate(userId, title, message, type, sourceType, sourceId, NotificationPriority.MEDIUM.name(), actionUrl, "ANNOUNCEMENT_CREATED");
        }
    }

    /** Un seul destinataire (ex. auteur du post ou auteur du commentaire parent). */
    public void notifyUser(Long userId, String title, String message, NotificationType type, String sourceType, Long sourceId, String actionUrl) {
        if (userId == null) {
            return;
        }
        NotificationPriority priority = (type == NotificationType.WARNING || type == NotificationType.SYSTEM)
                ? NotificationPriority.HIGH
                : NotificationPriority.MEDIUM;
        createIfNotDuplicate(userId, title, message, type, sourceType, sourceId, priority.name(), actionUrl, "CONTENT_INTERACTION");
    }

    /**
     * Rappel intelligent : si un utilisateur n'a pas d'activite forum recente (post/comment),
     * on cree une notification LOW une fois par jour max.
     */
    public int createInactivityReminders() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(Math.max(1, inactivityDays));
        LocalDateTime duplicateWindow = LocalDateTime.now().minusHours(24);

        int createdCount = 0;
        for (Long userId : fetchAllUserIds()) {
            if (userId == null || hasRecentForumActivity(userId, threshold)) {
                continue;
            }
            boolean alreadyRemindedToday = notificationRepository.existsByUserIdAndSourceTypeAndCreatedAtAfter(
                    userId,
                    "INACTIVITY_REMINDER",
                    duplicateWindow
            );
            if (alreadyRemindedToday) {
                continue;
            }
            createIfNotDuplicate(
                    userId,
                    "On ne vous voit plus",
                    "Vous n'avez eu aucune activite recente. Revenez voir les nouvelles discussions et annonces.",
                    NotificationType.SYSTEM,
                    "INACTIVITY_REMINDER",
                    userId,
                    NotificationPriority.LOW.name(),
                    "/forum",
                    "INACTIVITY_REMINDER"
            );
            createdCount++;
        }
        return createdCount;
    }

    /** Evite de recreer la meme alerte (meme type + source + titre) sur les 5 dernieres notifs du user. */
    private void createIfNotDuplicate(
            Long userId,
            String title,
            String message,
            NotificationType type,
            String sourceType,
            Long sourceId,
            String priority,
            String actionUrl,
            String triggerType
    ) {
        List<Notification> latest = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        boolean duplicate = latest.stream()
                .limit(5)
                .anyMatch(n -> Objects.equals(n.getType(), type)
                        && Objects.equals(n.getSourceType(), sourceType)
                        && Objects.equals(n.getSourceId(), sourceId)
                        && Objects.equals(n.getTitle(), title));
        if (duplicate) {
            return;
        }

        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setTitle(title);
        request.setMessage(message);
        request.setType(type);
        request.setSourceType(sourceType);
        request.setSourceId(sourceId);
        request.setPriority(priority);
        request.setTriggerType(triggerType);
        request.setActionUrl(actionUrl);
        create(request);
    }

    /** Securite metier : seul le proprietaire peut modifier/supprimer sa notification. */
    private void ensureOwner(Notification notification, Long userId) {
        if (!Objects.equals(notification.getUserId(), userId)) {
            throw new RuntimeException("Acces refuse a cette notification.");
        }
    }

    /** Recupere les ids depuis users ; liste vide si echec (pas de blocage du forum). */
    public List<Long> fetchAllUserIds() {
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    usersServiceUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            List<Map<String, Object>> body = response.getBody();
            if (body == null) {
                return Collections.emptyList();
            }
            return body.stream()
                    .map(item -> item.get("id"))
                    .filter(Objects::nonNull)
                    .map(value -> Long.valueOf(value.toString()))
                    .collect(Collectors.toList());
        } catch (Exception ignored) {
            return Collections.emptyList();
        }
    }

    private boolean hasRecentForumActivity(Long userId, LocalDateTime threshold) {
        return forumPostRepository.existsByAuthorIdAndUpdatedAtAfter(userId, threshold)
                || commentRepository.existsByAuthorIdAndUpdatedAtAfter(userId, threshold);
    }

    private String resolvePriority(String rawPriority, NotificationType type, String triggerType) {
        String normalized = normalizePriority(rawPriority);
        if (normalized != null) {
            return normalized;
        }
        if ("INACTIVITY_REMINDER".equalsIgnoreCase(triggerType)) {
            return NotificationPriority.LOW.name();
        }
        if (type == NotificationType.WARNING || type == NotificationType.SYSTEM) {
            return NotificationPriority.HIGH.name();
        }
        return NotificationPriority.MEDIUM.name();
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return null;
        }
        String normalized = priority.trim().toUpperCase();
        if (Objects.equals(normalized, NotificationPriority.HIGH.name())
                || Objects.equals(normalized, NotificationPriority.MEDIUM.name())
                || Objects.equals(normalized, NotificationPriority.LOW.name())) {
            return normalized;
        }
        return null;
    }
}
