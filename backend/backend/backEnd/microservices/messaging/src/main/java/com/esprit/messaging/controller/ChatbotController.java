package com.esprit.messaging.controller;

import com.esprit.messaging.dto.ChatbotMessageRequest;
import com.esprit.messaging.dto.ChatbotMessageResponse;
import com.esprit.messaging.service.ChatbotService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {
    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/message")
    public ResponseEntity<?> message(@RequestBody ChatbotMessageRequest request) {
        try {
            ChatbotMessageResponse response = chatbotService.processMessage(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("message", "Chatbot error."));
        }
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> history(@PathVariable Long userId) {
        return ResponseEntity.ok(chatbotService.getHistory(userId));
    }
}
