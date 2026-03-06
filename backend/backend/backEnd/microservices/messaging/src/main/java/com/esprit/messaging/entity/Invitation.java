package com.esprit.messaging.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invitations")
public class Invitation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "invitation_type", nullable = false, length = 50)
    private String invitationType;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false, columnDefinition = "DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
    
    // Constructeurs
    public Invitation() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }
    
    public Invitation(Long senderId, Long receiverId, String message, String invitationType) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.message = message;
        this.invitationType = invitationType;
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.invitationType == null || this.invitationType.isBlank()) {
            this.invitationType = "DISCUSSION";
        }
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public Long getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getInvitationType() {
        return invitationType;
    }
    
    public void setInvitationType(String invitationType) {
        this.invitationType = invitationType;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
        if (status.equals("ACCEPTED") || status.equals("REJECTED")) {
            this.respondedAt = LocalDateTime.now();
        }
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }
    
    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }
}
