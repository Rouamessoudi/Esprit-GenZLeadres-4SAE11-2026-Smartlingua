package com.esprit.aiassistant.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Mirror of messaging chat history so AI chats are also visible in chat_history.
 */
@Entity
@Table(name = "chat_history")
public class ChatHistoryMirror {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String response;

    @Column(name = "level_used", length = 10)
    private String levelUsed;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public void setLevelUsed(String levelUsed) {
        this.levelUsed = levelUsed;
    }
}
