package com.esprit.messaging;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class MessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender", nullable = false)
    private Long senderId;

    @Column(name = "receiver", nullable = false)
    private Long receiverId;

    // Legacy schema compatibility: existing table may still require *_id columns.
    @Column(name = "sender_id", nullable = false)
    private Long senderIdLegacy;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverIdLegacy;

    @Column(name = "conversation_id")
    private Long conversationId;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    // Legacy schema compatibility: existing table also expects `body`.
    @Column(name = "body", nullable = false, length = 2000)
    private String body;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_read")
    private Boolean read;

    @PrePersist
    void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = timestamp;
        }
        if (read == null) {
            read = Boolean.FALSE;
        }
        if (body == null || body.isBlank()) {
            body = content;
        }
        if (senderIdLegacy == null) {
            senderIdLegacy = senderId;
        }
        if (receiverIdLegacy == null) {
            receiverIdLegacy = receiverId;
        }
    }

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Long getSenderIdLegacy() {
        return senderIdLegacy;
    }

    public void setSenderIdLegacy(Long senderIdLegacy) {
        this.senderIdLegacy = senderIdLegacy;
    }

    public Long getReceiverIdLegacy() {
        return receiverIdLegacy;
    }

    public void setReceiverIdLegacy(Long receiverIdLegacy) {
        this.receiverIdLegacy = receiverIdLegacy;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }
}
