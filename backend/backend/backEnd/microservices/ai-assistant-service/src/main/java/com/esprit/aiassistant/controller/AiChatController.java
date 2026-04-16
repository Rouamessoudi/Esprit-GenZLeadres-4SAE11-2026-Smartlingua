package com.esprit.aiassistant.controller;

import com.esprit.aiassistant.dto.AiConversationDto;
import com.esprit.aiassistant.dto.AiMessageDto;
import com.esprit.aiassistant.dto.ChatRequest;
import com.esprit.aiassistant.dto.ChatResponse;
import com.esprit.aiassistant.dto.CreateConversationRequest;
import com.esprit.aiassistant.entity.AiConversation;
import com.esprit.aiassistant.entity.AiMessage;
import com.esprit.aiassistant.service.AiChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller REST pour gérer le module AI Assistant
 * Toutes les routes commencent par /api/ai
 * L'utilisateur est identifié par X-User-Id (temporaire, à remplacer par Keycloak plus tard)
 */
@RestController
public class AiChatController {

    // Service principal qui contient la logique métier
    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    // Créer une nouvelle conversation
    @PostMapping("/api/ai/conversations")
    public ResponseEntity<AiConversationDto> createConversation(
            @RequestBody(required = false) CreateConversationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        // Appel du service pour créer la conversation
        AiConversation created = aiChatService.createConversation(
                userId,
                request != null ? request.getTitle() : null
        );

        // Retourner la conversation sous forme DTO
        return ResponseEntity.ok(toConversationDto(created));
    }

    // Récupérer toutes les conversations de l'utilisateur
    @GetMapping("/api/ai/conversations/my")
    public ResponseEntity<List<AiConversationDto>> myConversations(
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        List<AiConversationDto> result = aiChatService.myConversations(userId).stream()
                .map(this::toConversationDto) // conversion Entity -> DTO
                .toList();

        return ResponseEntity.ok(result);
    }

    // Récupérer les messages d'une conversation
    @GetMapping("/api/ai/conversations/{conversationId}/messages")
    public ResponseEntity<List<AiMessageDto>> messages(
            @PathVariable Long conversationId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        List<AiMessageDto> result = aiChatService.conversationMessages(conversationId, userId).stream()
                .map(this::toMessageDto) // conversion Entity -> DTO
                .toList();

        return ResponseEntity.ok(result);
    }

    // Envoyer un message texte à l'IA
    @PostMapping("/api/ai/chat")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        // Appel du service pour générer la réponse IA
        ChatResponse response = aiChatService.chat(
                request.getMessage(),
                request.getConversationId(),
                userId
        );

        return ResponseEntity.ok(response);
    }

    // Envoyer une image + question à l'IA
    @PostMapping("/api/ai/chat/image")
    public ResponseEntity<ChatResponse> chatWithImage(
            @RequestParam(value = "conversationId", required = false) Long conversationId,
            @RequestParam("question") String question,
            @RequestParam("image") MultipartFile image,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        // Traitement image + question
        ChatResponse response = aiChatService.chatWithImage(conversationId, question, image, userId);

        return ResponseEntity.ok(response);
    }

    // Supprimer une conversation spécifique
    @DeleteMapping("/api/ai/conversations/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        aiChatService.deleteConversation(conversationId, userId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    // Supprimer toutes les conversations de l'utilisateur
    @DeleteMapping("/api/ai/conversations/my/all")
    public ResponseEntity<java.util.Map<String, Long>> deleteAll(
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        long count = aiChatService.deleteAllMyConversations(userId);

        // Retourne le nombre de conversations supprimées
        return ResponseEntity.ok(java.util.Map.of("deletedConversations", count));
    }

    // Conversion Entity -> DTO pour conversation
    private AiConversationDto toConversationDto(AiConversation c) {
        return new AiConversationDto(
                c.getId(),
                c.getTitle(),
                c.getLastMessagePreview(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    // Conversion Entity -> DTO pour message
    private AiMessageDto toMessageDto(AiMessage m) {
        return new AiMessageDto(
                m.getId(),
                m.getSender(),
                m.getMessageType(),
                m.getContent(),
                m.getImageName(),
                m.getImageContentType(),
                m.getImageSize(),
                m.getTimestamp()
        );
    }
}