package com.esprit.messaging.service;

import com.esprit.messaging.dto.ChatbotMessageRequest;
import com.esprit.messaging.dto.ChatbotMessageResponse;
import com.esprit.messaging.dto.ResourceDto;
import com.esprit.messaging.entity.ChatHistory;
import com.esprit.messaging.entity.Resource;
import com.esprit.messaging.entity.StudentLevel;
import com.esprit.messaging.repository.ChatHistoryRepository;
import com.esprit.messaging.repository.StudentLevelRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatbotService {
    private static final List<String> VALID_LEVELS = Arrays.asList("A1", "A2", "B1", "B2", "C1", "C2");
    private static final Pattern LEVEL_PATTERN = Pattern.compile("\\b(A1|A2|B1|B2|C1|C2)\\b", Pattern.CASE_INSENSITIVE);

    private final ChatHistoryRepository chatHistoryRepository;
    private final StudentLevelRepository studentLevelRepository;
    private final ResourceRecommendationService recommendationService;

    public ChatbotService(
        ChatHistoryRepository chatHistoryRepository,
        StudentLevelRepository studentLevelRepository,
        ResourceRecommendationService recommendationService
    ) {
        this.chatHistoryRepository = chatHistoryRepository;
        this.studentLevelRepository = studentLevelRepository;
        this.recommendationService = recommendationService;
    }

    public ChatbotMessageResponse processMessage(ChatbotMessageRequest req) {
        if (req.getUserId() == null || req.getMessage() == null || req.getMessage().isBlank()) {
            throw new IllegalArgumentException("userId and message are required");
        }

        String level = resolveLevel(req.getUserId(), req.getLevel(), req.getMessage());
        if (level == null) {
            String reply = "Please choose your level first (A1, A2, B1, B2, C1, C2) so I can recommend the right resources.";
            saveChat(req.getUserId(), req.getMessage(), reply, null);
            return new ChatbotMessageResponse(reply, null, true, List.of());
        }

        List<Resource> resources = recommendationService.pickResources(level, req.getMessage());
        recommendationService.saveRecommendationsForUser(req.getUserId(), resources);

        List<ResourceDto> resourceDtos = resources.stream()
            .map(r -> new ResourceDto(r.getId(), r.getTitle(), r.getDescription(), r.getLevel(), r.getCategory(), r.getUrl()))
            .toList();

        String reply = buildReply(level, req.getMessage(), resourceDtos);
        saveChat(req.getUserId(), req.getMessage(), reply, level);
        return new ChatbotMessageResponse(reply, level, false, resourceDtos);
    }

    public List<Map<String, Object>> getHistory(Long userId) {
        return chatHistoryRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(h -> Map.<String, Object>of(
                "id", h.getId(),
                "userId", h.getUserId(),
                "message", h.getMessage(),
                "response", h.getResponse(),
                "level", h.getLevelUsed() == null ? "" : h.getLevelUsed(),
                "createdAt", h.getCreatedAt()
            ))
            .toList();
    }

    private String resolveLevel(Long userId, String requestLevel, String message) {
        String normalizedRequestLevel = normalizeLevel(requestLevel);
        if (normalizedRequestLevel != null) {
            upsertLevel(userId, normalizedRequestLevel);
            return normalizedRequestLevel;
        }

        String fromMessage = detectLevelFromMessage(message);
        if (fromMessage != null) {
            upsertLevel(userId, fromMessage);
            return fromMessage;
        }

        return studentLevelRepository.findByUserId(userId)
            .map(StudentLevel::getLevel)
            .map(this::normalizeLevel)
            .orElse(null);
    }

    private String detectLevelFromMessage(String message) {
        if (message == null) return null;
        Matcher matcher = LEVEL_PATTERN.matcher(message);
        if (!matcher.find()) return null;
        return normalizeLevel(matcher.group(1));
    }

    private String normalizeLevel(String level) {
        if (level == null) return null;
        String normalized = level.trim().toUpperCase(Locale.ROOT);
        return VALID_LEVELS.contains(normalized) ? normalized : null;
    }

    private void upsertLevel(Long userId, String level) {
        Optional<StudentLevel> maybe = studentLevelRepository.findByUserId(userId);
        StudentLevel studentLevel = maybe.orElseGet(StudentLevel::new);
        studentLevel.setUserId(userId);
        studentLevel.setLevel(level);
        studentLevelRepository.save(studentLevel);
    }

    private void saveChat(Long userId, String msg, String reply, String level) {
        ChatHistory history = new ChatHistory();
        history.setUserId(userId);
        history.setMessage(msg);
        history.setResponse(reply);
        history.setLevelUsed(level);
        chatHistoryRepository.save(history);
    }

    private String buildReply(String level, String message, List<ResourceDto> resources) {
        String need = inferNeed(message);
        String intro = "Great! Based on your " + level + " level, here are recommended " + need + " resources:";
        if (resources.isEmpty()) {
            return "I could not find resources for level " + level + " yet. Please ask admin to add some resources.";
        }
        return intro;
    }

    private String inferNeed(String message) {
        if (message == null) return "learning";
        String text = message.toLowerCase(Locale.ROOT);
        if (text.contains("grammar")) return "grammar";
        if (text.contains("vocabulary")) return "vocabulary";
        if (text.contains("pronunciation")) return "pronunciation";
        if (text.contains("listening")) return "listening";
        if (text.contains("speaking")) return "speaking";
        if (text.contains("youtube") || text.contains("playlist")) return "YouTube playlist";
        return "learning";
    }
}
