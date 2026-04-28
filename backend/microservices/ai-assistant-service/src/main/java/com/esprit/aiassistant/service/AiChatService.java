package com.esprit.aiassistant.service;

import com.esprit.aiassistant.dto.ChatResponse;
import com.esprit.aiassistant.entity.AiConversation;
import com.esprit.aiassistant.entity.AiMessage;
import com.esprit.aiassistant.entity.ChatHistoryMirror;
import com.esprit.aiassistant.entity.MessageSender;
import com.esprit.aiassistant.entity.MessageType;
import com.esprit.aiassistant.repository.AiConversationRepository;
import com.esprit.aiassistant.repository.AiMessageRepository;
import com.esprit.aiassistant.repository.ChatHistoryMirrorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Logique métier : conversations et messages persistés en base, appels à {@link GeminiService}.
 * Chaque conversation est rattachée à un {@code userId} ; l’accès est refusé si la conversation
 * n’appartient pas à cet utilisateur.
 */
@Service
public class AiChatService {
    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final ChatHistoryMirrorRepository chatHistoryMirrorRepository;
    private final GeminiService geminiService;

    public AiChatService(
        AiConversationRepository conversationRepository,
        AiMessageRepository messageRepository,
        ChatHistoryMirrorRepository chatHistoryMirrorRepository,
        GeminiService geminiService
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.chatHistoryMirrorRepository = chatHistoryMirrorRepository;
        this.geminiService = geminiService;
    }

    @Transactional
    public ChatResponse chat(String message, Long conversationId, Long userId) {
        requireUser(userId);
        String trimmed = message.trim();
        if (trimmed.isBlank()) {
            throw new IllegalArgumentException("message is required");
        }
        log.info("AI chat request userId={} conversationId={} message='{}'",
                userId, conversationId, shorten(trimmed, 120));
        AiConversation conversation = resolveConversation(conversationId, userId, trimmed);

        AiMessage userMsg = new AiMessage(conversation, MessageSender.USER, MessageType.TEXT, trimmed, LocalDateTime.now());
        messageRepository.save(userMsg);
        touchConversation(conversation, trimmed);

        String reply = geminiService.generateEnglishTeacherReply(trimmed);
        reply = ensureUsableReply(reply, trimmed);
        log.info("AI chat response userId={} conversationId={} reply='{}'",
                userId, conversation.getId(), shorten(reply, 160));

        AiMessage aiMsg = new AiMessage(conversation, MessageSender.AI, MessageType.TEXT, reply, LocalDateTime.now());
        messageRepository.save(aiMsg);
        touchConversation(conversation, reply);
        saveMirrorHistory(userId, trimmed, reply);

        return new ChatResponse(reply, conversation.getId());
    }

    @Transactional
    public ChatResponse chatWithImage(Long conversationId, String question, MultipartFile image, Long userId) {
        requireUser(userId);
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("image is required");
        }
        String contentType = image.getContentType() != null ? image.getContentType() : "";
        boolean allowedType = MediaType.IMAGE_JPEG_VALUE.equalsIgnoreCase(contentType)
            || MediaType.IMAGE_PNG_VALUE.equalsIgnoreCase(contentType)
            || "image/jpg".equalsIgnoreCase(contentType)
            || MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(contentType);
        if (!allowedType) {
            throw new IllegalArgumentException("Only JPG/JPEG/PNG/PDF files are allowed");
        }

        String safeQuestion = question == null ? "" : question.trim();
        if (safeQuestion.isBlank()) {
            throw new IllegalArgumentException("question is required");
        }

        AiConversation conversation = resolveConversation(conversationId, userId, safeQuestion);

        AiMessage userMsg = new AiMessage(conversation, MessageSender.USER, MessageType.IMAGE_QUESTION, safeQuestion, LocalDateTime.now());
        userMsg.setImageName(image.getOriginalFilename());
        userMsg.setImageContentType(contentType);
        userMsg.setImageSize(image.getSize());
        messageRepository.save(userMsg);
        touchConversation(conversation, safeQuestion);

        String reply = geminiService.generateEnglishTeacherReplyWithImage(safeQuestion, image);
        reply = ensureUsableReply(reply, safeQuestion);

        AiMessage aiMsg = new AiMessage(conversation, MessageSender.AI, MessageType.IMAGE_ANALYSIS, reply, LocalDateTime.now());
        aiMsg.setImageName(image.getOriginalFilename());
        aiMsg.setImageContentType(contentType);
        aiMsg.setImageSize(image.getSize());
        messageRepository.save(aiMsg);
        touchConversation(conversation, reply);
        saveMirrorHistory(userId, safeQuestion, reply);

        return new ChatResponse(reply, conversation.getId());
    }

    @Transactional
    public AiConversation createConversation(Long userId, String title) {
        requireUser(userId);
        String safeTitle = title == null ? "" : title.trim();
        if (safeTitle.isBlank()) {
            safeTitle = "New conversation";
        }
        AiConversation conversation = new AiConversation();
        conversation.setUserId(userId);
        conversation.setTitle(shorten(safeTitle, 180));
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<AiConversation> myConversations(Long userId) {
        requireUser(userId);
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<AiMessage> conversationMessages(Long conversationId, Long userId) {
        AiConversation conversation = requireConversationOwnership(conversationId, userId);
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId());
    }

    @Transactional
    public void deleteConversation(Long conversationId, Long userId) {
        AiConversation conversation = requireConversationOwnership(conversationId, userId);
        conversationRepository.delete(conversation);
    }

    @Transactional
    public long deleteAllMyConversations(Long userId) {
        requireUser(userId);
        return conversationRepository.deleteByUserId(userId);
    }

    private AiConversation resolveConversation(Long conversationId, Long userId, String firstMessage) {
        if (conversationId == null) {
            AiConversation c = new AiConversation();
            c.setUserId(userId);
            c.setCreatedAt(LocalDateTime.now());
            c.setUpdatedAt(LocalDateTime.now());
            c.setTitle(shorten(firstMessage, 180));
            return conversationRepository.save(c);
        }
        return requireConversationOwnership(conversationId, userId);
    }

    private AiConversation requireConversationOwnership(Long conversationId, Long userId) {
        requireUser(userId);
        return conversationRepository.findByIdAndUserId(conversationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
    }

    private void requireUser(Long userId) {
        if (userId == null || userId <= 0) {
            throw new SecurityException("Unauthorized: missing or invalid user.");
        }
    }

    private void touchConversation(AiConversation conversation, String lastContent) {
        if (conversation.getTitle() == null || conversation.getTitle().isBlank() || "New conversation".equalsIgnoreCase(conversation.getTitle())) {
            conversation.setTitle(shorten(lastContent, 180));
        }
        conversation.setUpdatedAt(LocalDateTime.now());
        conversation.setLastMessagePreview(shorten(lastContent, 400));
        conversationRepository.save(conversation);
    }

    private String shorten(String input, int maxLen) {
        String s = input == null ? "" : input.trim().replaceAll("\\s+", " ");
        if (s.isBlank()) {
            return "";
        }
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }

    private void saveMirrorHistory(Long userId, String message, String reply) {
        ChatHistoryMirror row = new ChatHistoryMirror();
        row.setUserId(userId);
        row.setMessage(message);
        row.setResponse(reply);
        row.setLevelUsed("AI");
        chatHistoryMirrorRepository.save(row);
    }

    private String ensureUsableReply(String reply, String userMessage) {
        String safe = reply == null ? "" : reply.trim();
        if (safe.isBlank()) {
            return geminiService.generateEnglishTeacherReply(userMessage);
        }
        String lower = safe.toLowerCase();
        if (lower.contains("the ai service returned an error")
            || lower.contains("please try again in a moment")
            || lower.contains("could not reach the ai service")) {
            return geminiService.generateEnglishTeacherReply(userMessage);
        }
        return safe;
    }
}
