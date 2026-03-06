package com.esprit.messaging.controller;

import com.esprit.messaging.dto.MessageDTO;
import com.esprit.messaging.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * Endpoint pour envoyer un message via WebSocket
     * Les clients envoient des messages à /app/chat.sendMessage
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> payload) {
        try {
            Long senderId = Long.valueOf(payload.get("senderId").toString());
            Long receiverId = Long.valueOf(payload.get("receiverId").toString());
            String content = payload.get("content").toString();
            
            // Sauvegarder le message dans la base de données
            MessageDTO message = messageService.sendMessage(senderId, receiverId, content);
            
            // Envoyer le message au destinataire via WebSocket
            messagingTemplate.convertAndSend("/queue/messages/" + receiverId, message);
            
            // Envoyer aussi une confirmation à l'expéditeur
            messagingTemplate.convertAndSend("/queue/messages/" + senderId, message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Endpoint pour notifier qu'un message a été lu
     */
    @MessageMapping("/chat.markAsRead")
    public void markAsRead(@Payload Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            Long conversationId = Long.valueOf(payload.get("conversationId").toString());
            
            messageService.markMessagesAsRead(userId, conversationId);
            
            // Notifier les autres participants
            messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/read",
                (Object) Map.of("userId", userId, "conversationId", conversationId));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
