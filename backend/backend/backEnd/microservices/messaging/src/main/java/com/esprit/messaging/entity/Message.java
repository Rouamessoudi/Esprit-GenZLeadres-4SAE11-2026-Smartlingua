package com.esprit.messaging.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long senderId; // ID de l'utilisateur qui envoie
    
    @Column(nullable = false)
    private Long receiverId; // ID de l'utilisateur qui reçoit
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Contenu du message (texte ou data URL pour image)
    
    @Column(nullable = false)
    private LocalDateTime timestamp; // Date et heure d'envoi
    
    @Column(nullable = false)
    private Boolean isRead = false; // Statut de lecture
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation; // Conversation à laquelle appartient le message
    
    // Constructeurs
    public Message() {
        this.timestamp = LocalDateTime.now();
    }
    
    public Message(Long senderId, Long receiverId, String content) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = LocalDateTime.now();
        this.isRead = false;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.timestamp == null) this.timestamp = LocalDateTime.now();
        if (this.isRead == null) this.isRead = false;
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
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public Conversation getConversation() {
        return conversation;
    }
    
    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }
}
