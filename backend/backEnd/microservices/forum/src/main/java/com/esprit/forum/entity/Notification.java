package com.esprit.forum.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entite JPA du module Notifications : une ligne = une alerte pour UN utilisateur.
 * Persistee en MySQL (table {@code notifications}, base forumdb).
 * Le {@code userId} fait le lien logique avec l'utilisateur du microservice users (pas de FK JPA vers une autre base).
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Destinataire de la notification (id utilisateur SmartLingua / users). */
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    /** Type metier : ANNOUNCEMENT, COMMENT, REPLY, SYSTEM, WARNING (stocke en texte en base). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    /** false = non lue, true = lue (pour badge et filtres). */
    @Column(nullable = false)
    private Boolean isRead = false;

    /** Exemple : ANNOUNCEMENT, FORUM_POST, COMMENT — pour savoir d'ou vient l'evenement. */
    @Column(length = 50)
    private String sourceType;

    /** Id de l'annonce, du post ou du commentaire source (optionnel). */
    private Long sourceId;

    @Column(length = 20)
    private String priority;

    /** Type de declencheur metier (ANNOUNCEMENT_CREATED, COMMENT_ADDED, INACTIVITY_REMINDER...). */
    @Column(length = 60)
    private String triggerType;

    /** Lien relatif cote front (ex. /forum/5) pour navigation future. */
    @Column(length = 255)
    private String actionUrl;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** Remplit createdAt/updatedAt et isRead par defaut a l'insertion. */
    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isRead == null) {
            this.isRead = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean read) { isRead = read; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
