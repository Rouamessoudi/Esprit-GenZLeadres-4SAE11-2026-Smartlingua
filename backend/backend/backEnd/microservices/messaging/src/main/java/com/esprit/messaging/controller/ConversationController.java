package com.esprit.messaging.controller;

import com.esprit.messaging.dto.ConversationDTO;
import com.esprit.messaging.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messaging/conversations")
public class ConversationController {
    
    @Autowired
    private ConversationService conversationService;
    
    /**
     * Récupérer toutes les conversations d'un utilisateur
     * GET /messaging/conversations/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(
            @PathVariable Long userId) {
        List<ConversationDTO> conversations = conversationService.getUserConversations(userId);
        return ResponseEntity.ok(conversations);
    }
    
    /**
     * Récupérer une conversation spécifique avec ses messages
     * GET /messaging/conversations/{conversationId}/user/{userId}
     */
    @GetMapping("/{conversationId}/user/{userId}")
    public ResponseEntity<ConversationDTO> getConversationById(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        try {
            ConversationDTO conversation = conversationService
                .getConversationById(conversationId, userId);
            return ResponseEntity.ok(conversation);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    /**
     * Récupérer une conversation entre deux utilisateurs (si elle existe).
     * Une conversation n'existe qu'après acceptation d'une invitation.
     * GET /messaging/conversations/between/{userId1}/{userId2}
     * Retourne 404 si aucune conversation.
     */
    @GetMapping("/between/{userId1}/{userId2}")
    public ResponseEntity<ConversationDTO> getOrCreateConversation(
            @PathVariable Long userId1,
            @PathVariable Long userId2) {
        try {
            ConversationDTO conversation = conversationService
                .getOrCreateConversation(userId1, userId2);
            return ResponseEntity.ok(conversation);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
