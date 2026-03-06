package com.esprit.messaging.entity;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
public class Conversation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long participant1Id; // Premier participant (étudiant ou enseignant)
    
    @Column(nullable = false)
    private Long participant2Id; // Deuxième participant (étudiant ou enseignant)
    
    @Column(nullable = false)
    private LocalDateTime createdAt; // Date de création de la conversation
    
    @Column(nullable = false)
    private LocalDateTime updatedAt; // Date de dernière mise à jour
    
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Message> messages = new ArrayList<>(); // Liste des messages dans la conversation
    
    // Constructeurs
    public Conversation() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Conversation(Long participant1Id, Long participant2Id) {
        this.participant1Id = participant1Id;
        this.participant2Id = participant2Id;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
    }
    
    // Méthode pour obtenir l'autre participant
    public Long getOtherParticipant(Long userId) {
        if (participant1Id.equals(userId)) {
            return participant2Id;
        } else if (participant2Id.equals(userId)) {
            return participant1Id;
        }
        return null;
    }
    
    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getParticipant1Id() {
        return participant1Id;
    }
    
    public void setParticipant1Id(Long participant1Id) {
        this.participant1Id = participant1Id;
    }
    
    public Long getParticipant2Id() {
        return participant2Id;
    }
    
    public void setParticipant2Id(Long participant2Id) {
        this.participant2Id = participant2Id;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<Message> getMessages() {
        return messages;
    }
    
    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }
    
    public void addMessage(Message message) {
        messages.add(message);
        message.setConversation(this);
        this.updatedAt = LocalDateTime.now();
    }
}
