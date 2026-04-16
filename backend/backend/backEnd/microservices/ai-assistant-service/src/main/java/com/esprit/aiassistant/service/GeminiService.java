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
            return "The AI assistant is not configured (missing API key). Set the environment variable GEMINI_API_KEY or gemini.api.key in application properties on the server.";
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
            return friendlyError("The AI service returned an error. Please try again in a moment.");
        } catch (Exception e) {
            log.error("Gemini call failed", e);
            return friendlyError("Could not reach the AI service. Please try again later.");
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
