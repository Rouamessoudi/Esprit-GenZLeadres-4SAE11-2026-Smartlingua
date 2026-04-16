package com.esprit.quiz.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Appelle l'API publique LanguageTool (v2/check), calcule un score et applique les corrections suggérées.
 */
@Service
public class LanguageToolNlpService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${languagetool.api.url:https://api.languagetool.org/v2/check}")
    private String languageToolUrl;

    /** Points retirés par erreur détectée (score initial 100). */
    @Value("${languagetool.score.penalty-per-error:5}")
    private int penaltyPerError;

    public LanguageToolNlpService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Verif grammaticale brute : texte corrige + nombre d'erreurs (sans regle de score metier).
     */
    public GrammarCheckResult checkGrammar(String text, String language) {
        String lang = (language == null || language.isBlank()) ? "en-US" : language.trim();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("text", text);
        form.add("language", lang);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(form, headers);
        ResponseEntity<String> response;
        try {
            response = restTemplate.postForEntity(languageToolUrl, request, String.class);
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de contacter LanguageTool.");
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Reponse LanguageTool invalide.");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new IllegalStateException("Reponse LanguageTool illisible.");
        }
        JsonNode matches = root.path("matches");
        int errorsCount = matches.isArray() ? matches.size() : 0;
        String corrected = applyReplacements(text, matches);

        return new GrammarCheckResult(corrected, errorsCount);
    }

    /** Endpoint NLP general : penalite configurable (pas le placement test). */
    public NlpResult analyze(String text, String language) {
        GrammarCheckResult check = checkGrammar(text, language);
        int score = computeNlpScore(check.errorsCount());
        return new NlpResult(check.correctedText(), check.errorsCount(), score);
    }

    private int computeNlpScore(int errorsCount) {
        int raw = 100 - errorsCount * penaltyPerError;
        return Math.max(0, Math.min(100, raw));
    }

    public record GrammarCheckResult(String correctedText, int errorsCount) {
    }

    /**
     * Applique la première suggestion de remplacement pour chaque match, du plus grand offset au plus petit.
     */
    private String applyReplacements(String original, JsonNode matches) {
        if (!matches.isArray() || matches.isEmpty()) {
            return original;
        }

        List<JsonNode> list = new ArrayList<>();
        matches.forEach(list::add);
        list.sort(Comparator.comparingInt(m -> m.path("offset").asInt(0)));
        // appliquer depuis la fin pour garder les offsets valides
        list.sort(Comparator.comparingInt((JsonNode m) -> m.path("offset").asInt(0)).reversed());

        String result = original;
        for (JsonNode match : list) {
            JsonNode replacements = match.path("replacements");
            if (!replacements.isArray() || replacements.isEmpty()) {
                continue;
            }
            String replacement = replacements.get(0).path("value").asText(null);
            if (replacement == null) {
                continue;
            }
            int offset = match.path("offset").asInt(-1);
            int length = match.path("length").asInt(-1);
            if (offset < 0 || length < 0 || offset + length > result.length()) {
                continue;
            }
            result = result.substring(0, offset) + replacement + result.substring(offset + length);
        }
        return result;
    }

    public record NlpResult(String correctedText, int errorsCount, int score) {
    }
}
