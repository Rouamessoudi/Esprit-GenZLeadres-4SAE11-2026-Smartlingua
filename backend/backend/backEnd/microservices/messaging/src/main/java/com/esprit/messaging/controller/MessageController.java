package com.esprit.messaging.controller;

import com.esprit.messaging.dto.MessageDTO;
import com.esprit.messaging.dto.SendMessageRequest;
import com.esprit.messaging.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messaging/messages")
public class MessageController {
    
    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Envoyer un message
     * POST /messaging/messages/send/{senderId}
     * Envoie aussi le message en temps réel via WebSocket au destinataire et à l'expéditeur.
     */
    @PostMapping("/send/{senderId}")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long senderId,
            @RequestBody SendMessageRequest request) {
        try {
            MessageDTO message = messageService.sendMessage(
                senderId, 
                request.getReceiverId(), 
                request.getContent()
            );
            // Push en temps réel au destinataire et à l'expéditeur (pour confirmation immédiate)
            messagingTemplate.convertAndSend("/queue/messages/" + message.getReceiverId(), message);
            messagingTemplate.convertAndSend("/queue/messages/" + message.getSenderId(), message);
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (RuntimeException e) {
            return ResponseEntity.<MessageDTO>status(HttpStatus.BAD_REQUEST)
                .header("X-Error-Message", e.getMessage())
                .body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * Récupérer les messages d'une conversation
     * GET /messaging/messages/conversation/{conversationId}
     */
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<MessageDTO>> getConversationMessages(
            @PathVariable Long conversationId) {
        List<MessageDTO> messages = messageService.getConversationMessages(conversationId);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Récupérer les messages entre deux utilisateurs
     * GET /messaging/messages/between/{userId1}/{userId2}
     */
    @GetMapping("/between/{userId1}/{userId2}")
    public ResponseEntity<List<MessageDTO>> getMessagesBetweenUsers(
            @PathVariable Long userId1,
            @PathVariable Long userId2) {
        List<MessageDTO> messages = messageService.getMessagesBetweenUsers(userId1, userId2);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Marquer les messages comme lus
     * PUT /messaging/messages/mark-read/{userId}/{conversationId}
     */
    @PutMapping("/mark-read/{userId}/{conversationId}")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long userId,
            @PathVariable Long conversationId) {
        messageService.markMessagesAsRead(userId, conversationId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Compter les messages non lus pour un utilisateur
     * GET /messaging/messages/unread-count/{userId}
     */
    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        Long count = messageService.countUnreadMessages(userId);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Récupérer les messages non lus pour un utilisateur
     * GET /messaging/messages/unread/{userId}
     */
    @GetMapping("/unread/{userId}")
    public ResponseEntity<List<MessageDTO>> getUnreadMessages(@PathVariable Long userId) {
        List<MessageDTO> messages = messageService.getUnreadMessages(userId);
        return ResponseEntity.ok(messages);
    }
}
