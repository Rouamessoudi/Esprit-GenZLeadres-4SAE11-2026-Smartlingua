package com.esprit.messaging.controller;

import com.esprit.messaging.entity.TranslationHistory;
import com.esprit.messaging.repository.TranslationHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    private static final String LIBRE_TRANSLATE_URL = "https://libretranslate.de/translate";
    private static final String MY_MEMORY_URL = "https://api.mymemory.translated.net/get";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    private final TranslationHistoryRepository translationHistoryRepository;

    public TranslationController(TranslationHistoryRepository translationHistoryRepository) {
        this.translationHistoryRepository = translationHistoryRepository;
    }

    /**
     * Retourne la liste des langues exposees au frontend.
     * On reprend les langues communes des instances LibreTranslate.
     */
    @GetMapping("/languages")
    public ResponseEntity<List<Map<String, String>>> languages() {
        List<Map<String, String>> languages = List.of(
            Map.of("code", "en", "name", "English"),
            Map.of("code", "fr", "name", "French"),
            Map.of("code", "ar", "name", "Arabic"),
            Map.of("code", "es", "name", "Spanish"),
            Map.of("code", "de", "name", "German"),
            Map.of("code", "it", "name", "Italian"),
            Map.of("code", "pt", "name", "Portuguese"),
            Map.of("code", "nl", "name", "Dutch"),
            Map.of("code", "ru", "name", "Russian"),
            Map.of("code", "zh", "name", "Chinese"),
            Map.of("code", "ja", "name", "Japanese"),
            Map.of("code", "ko", "name", "Korean"),
            Map.of("code", "uk", "name", "Ukrainian"),
            Map.of("code", "cs", "name", "Czech"),
            Map.of("code", "hu", "name", "Hungarian"),
            Map.of("code", "tr", "name", "Turkish"),
            Map.of("code", "pl", "name", "Polish"),
            Map.of("code", "ro", "name", "Romanian"),
            Map.of("code", "el", "name", "Greek"),
            Map.of("code", "sv", "name", "Swedish"),
            Map.of("code", "fi", "name", "Finnish"),
            Map.of("code", "da", "name", "Danish")
        );
        return ResponseEntity.ok(languages);
    }

    @GetMapping("/history")
    public ResponseEntity<?> history(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Missing X-User-Id header."));
        }

        List<TranslationHistory> rows = translationHistoryRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> response = new ArrayList<>();
        for (TranslationHistory row : rows) {
            response.add(Map.of(
                "id", row.getId(),
                "sourceLanguage", row.getSourceLanguage(),
                "targetLanguage", row.getTargetLanguage(),
                "inputText", row.getInputText(),
                "translatedText", row.getTranslatedText(),
                "provider", row.getProvider(),
                "createdAt", row.getCreatedAt()
            ));
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> translate(
        @RequestHeader(value = "X-User-Id", required = false) Long userId,
        @RequestBody TranslateRequest req
    ) {
        if (req == null || isBlank(req.getQ()) || isBlank(req.getSource()) || isBlank(req.getTarget())) {
            return ResponseEntity.badRequest().body(Map.of("message", "q, source and target are required."));
        }
        if (req.getSource().equalsIgnoreCase(req.getTarget())) {
            return ResponseEntity.badRequest().body(Map.of("message", "source and target must be different."));
        }

        try {
            TranslationResult result = translateViaLibreThenFallback(req);
            if (isBlank(result.text())) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Translation provider unavailable."));
            }

            if (userId != null) {
                TranslationHistory history = new TranslationHistory();
                history.setUserId(userId);
                history.setSourceLanguage(req.getSource());
                history.setTargetLanguage(req.getTarget());
                history.setInputText(req.getQ());
                history.setTranslatedText(result.text());
                history.setProvider(result.provider());
                translationHistoryRepository.save(history);
            }

            return ResponseEntity.ok(Map.of(
                "translatedText", result.text(),
                "provider", result.provider(),
                "createdAt", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "message", "Failed to translate text. The public LibreTranslate endpoint currently requires an API key."
            ));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private TranslationResult translateViaLibreThenFallback(TranslateRequest req) throws Exception {
        // First try the exact endpoint requested by the project requirements.
        String librePayload = objectMapper.writeValueAsString(Map.of(
            "q", req.getQ(),
            "source", req.getSource(),
            "target", req.getTarget(),
            "format", "text"
        ));

        HttpRequest libreRequest = HttpRequest.newBuilder()
            .uri(URI.create(LIBRE_TRANSLATE_URL))
            .timeout(Duration.ofSeconds(20))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(librePayload, StandardCharsets.UTF_8))
            .build();
        HttpResponse<String> libreResponse = httpClient.send(libreRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (isJson(libreResponse.body())) {
            JsonNode node = objectMapper.readTree(libreResponse.body());
            String translatedText = node.path("translatedText").asText("");
            if (!isBlank(translatedText)) {
                return new TranslationResult(translatedText, "libretranslate.de");
            }
        }

        // Fallback so the feature keeps working when public LibreTranslate instance blocks anonymous requests.
        String query = URLEncoder.encode(req.getQ(), StandardCharsets.UTF_8);
        String langPair = URLEncoder.encode(req.getSource() + "|" + req.getTarget(), StandardCharsets.UTF_8);
        String fallbackUrl = MY_MEMORY_URL + "?q=" + query + "&langpair=" + langPair;
        HttpRequest fallbackRequest = HttpRequest.newBuilder()
            .uri(URI.create(fallbackUrl))
            .timeout(Duration.ofSeconds(20))
            .GET()
            .build();
        HttpResponse<String> fallbackResponse = httpClient.send(fallbackRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (!isJson(fallbackResponse.body())) {
            return new TranslationResult("", "none");
        }

        JsonNode fallbackNode = objectMapper.readTree(fallbackResponse.body());
        String translatedText = fallbackNode.path("responseData").path("translatedText").asText("");
        return new TranslationResult(translatedText, "mymemory");
    }

    private boolean isJson(String body) {
        if (body == null) return false;
        String trimmed = body.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
    }

    private record TranslationResult(String text, String provider) {}

    public static class TranslateRequest {
        private String q;
        private String source;
        private String target;

        public String getQ() {
            return q;
        }

        public void setQ(String q) {
            this.q = q;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getTarget() {
            return target;
        }

        public void setTarget(String target) {
            this.target = target;
        }
    }
}
