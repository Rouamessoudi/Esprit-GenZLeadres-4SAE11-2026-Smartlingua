package com.esprit.aiassistant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Appels sortants vers l’API Google Generative Language (Gemini).
 * Clé : {@code gemini.api.key} ou variable d’environnement {@code GEMINI_API_KEY} — jamais exposée au client.
 * Base HTTP : {@link com.esprit.aiassistant.config.RestClientConfig}.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private static final String SYSTEM_PROMPT =
        "You are an AI English learning assistant for SmartLingua. "
            + "Answer clearly, pedagogically, and simply. Help students understand grammar, vocabulary, "
            + "exercises, and images related to English learning. If an image is provided, analyze it and "
            + "answer the user question based on the image.";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiService(
        RestClient geminiRestClient,
        ObjectMapper objectMapper,
        @Value("${gemini.api.key:}") String apiKeyProp,
        @Value("${gemini.api.model:gemini-2.5-flash}") String model
    ) {
        this.restClient = geminiRestClient;
        this.objectMapper = objectMapper;
        String fromProp = apiKeyProp != null ? apiKeyProp.trim() : "";
        String fromEnv = System.getenv("GEMINI_API_KEY");
        if (fromProp.isEmpty() && fromEnv != null && !fromEnv.isBlank()) {
            fromProp = fromEnv.trim();
        }
        this.apiKey = fromProp;
        this.model = model != null && !model.isBlank() ? model.trim() : "gemini-2.5-flash";
    }

    public String generateEnglishTeacherReply(String userMessage) {
        if (apiKey.isEmpty()) {
            log.warn("Gemini API key missing: using configuration warning response");
            return "[AI_NOT_CONFIGURED] Missing GEMINI_API_KEY on backend. Configure gemini.api.key or environment variable.";
        }
        String prompt = SYSTEM_PROMPT + "\n\nStudent message:\n" + userMessage;
        Map<String, Object> part = new LinkedHashMap<>();
        part.put("text", prompt);
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", List.of(part));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(content));

        String uri = "/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        try {
            String raw = restClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);
            return extractText(raw);
        } catch (RestClientException e) {
            log.warn("Gemini API HTTP error: {}", e.getMessage());
            return localFallbackReply(userMessage);
        } catch (Exception e) {
            log.error("Gemini call failed", e);
            return localFallbackReply(userMessage);
        }
    }

    public String generateEnglishTeacherReplyWithImage(String question, MultipartFile image) {
        if (apiKey.isEmpty()) {
            return "The AI assistant is not configured (missing API key). Set GEMINI_API_KEY on the server.";
        }
        try {
            String base64 = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

            Map<String, Object> textPart = new LinkedHashMap<>();
            textPart.put("text", SYSTEM_PROMPT + "\n\nQuestion about this image:\n" + question);

            Map<String, Object> inlineData = new LinkedHashMap<>();
            inlineData.put("mime_type", mimeType);
            inlineData.put("data", base64);
            Map<String, Object> imagePart = new LinkedHashMap<>();
            imagePart.put("inline_data", inlineData);

            Map<String, Object> content = new LinkedHashMap<>();
            content.put("parts", List.of(textPart, imagePart));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("contents", List.of(content));

            String uri = "/v1beta/models/" + model + ":generateContent?key=" + apiKey;
            String raw = restClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(body))
                .retrieve()
                .body(String.class);
            return extractText(raw);
        } catch (RestClientException e) {
            log.warn("Gemini image API HTTP error: {}", e.getMessage());
            return "The AI image analysis is temporarily unavailable. Please try again.";
        } catch (Exception e) {
            log.error("Gemini image call failed", e);
            return "Could not analyze this image right now. Please try again later.";
        }
    }

    private String friendlyError(String msg) {
        return msg;
    }

    /**
     * Offline fallback when Gemini is unavailable.
     * Keeps user experience functional and still persists chat history.
     */
    private String localFallbackReply(String userMessage) {
        String m = userMessage == null ? "" : userMessage.toLowerCase();

        if (m.contains("a1")) {
            return "I cannot reach the cloud AI now, so here is a local study plan for A1:\n"
                + "1) Learn greetings and daily expressions.\n"
                + "2) Study present simple + basic question forms.\n"
                + "3) Build 15-20 new words per week with flashcards.\n"
                + "4) Practice short listening (2-5 minutes) and repeat aloud daily.";
        }
        if (m.contains("a2")) {
            return "Cloud AI is temporarily unavailable. Local A2 plan:\n"
                + "1) Focus on past simple and future forms.\n"
                + "2) Practice short dialogs and role plays.\n"
                + "3) Read graded texts and summarize in 3-4 lines.\n"
                + "4) Keep a daily vocabulary notebook with examples.";
        }
        if (m.contains("b1")) {
            return "Cloud AI is temporarily unavailable. Local B1 plan:\n"
                + "1) Work on tenses contrast (present perfect vs past simple).\n"
                + "2) Practice speaking 10 minutes daily on one topic.\n"
                + "3) Watch English videos with subtitles, then without.\n"
                + "4) Write one paragraph per day and self-correct grammar.";
        }
        if (m.contains("b2") || m.contains("c1") || m.contains("c2")) {
            return "Cloud AI is temporarily unavailable. Advanced local plan:\n"
                + "1) Improve fluency with debates and opinion speaking.\n"
                + "2) Write structured essays with connectors and clear arguments.\n"
                + "3) Shadow native audio for pronunciation and intonation.\n"
                + "4) Review advanced grammar points from your recent mistakes.";
        }
        if (m.contains("grammar")) {
            return "I cannot reach cloud AI right now. Grammar quick method:\n"
                + "- Identify one grammar target (e.g. present perfect).\n"
                + "- Study one short rule + 5 examples.\n"
                + "- Do 10 exercises.\n"
                + "- Produce 5 personal sentences and read them aloud.";
        }
        if (m.contains("pronunciation") || m.contains("speaking")) {
            return "Cloud AI is unavailable now. Pronunciation/speaking routine:\n"
                + "- 5 minutes: minimal pairs (ship/sheep).\n"
                + "- 10 minutes: shadowing a short native clip.\n"
                + "- 5 minutes: record yourself and compare.\n"
                + "- Repeat daily for stable improvement.";
        }

        return "The cloud AI is temporarily unavailable, but I can still help.\n"
            + "Tell me your level (A1-C2) and goal (grammar, vocabulary, speaking, pronunciation), "
            + "and I will give you a tailored step-by-step plan now.";
    }

    private String extractText(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                JsonNode block = root.path("promptFeedback").path("blockReason");
                if (!block.isMissingNode() && !block.asText().isEmpty()) {
                    return "This request could not be processed by the AI safety filters. Please rephrase your question.";
                }
                return "The AI did not return a usable answer. Please try again.";
            }
            JsonNode text = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                return "The AI did not return text content. Please try again.";
            }
            return text.asText();
        } catch (Exception e) {
            log.warn("Failed to parse Gemini JSON: {}", e.getMessage());
            return "Could not read the AI response. Please try again.";
        }
    }
}
