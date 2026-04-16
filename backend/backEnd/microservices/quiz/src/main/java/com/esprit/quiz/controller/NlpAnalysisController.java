package com.esprit.quiz.controller;

import com.esprit.quiz.dto.NlpAnalyzeRequest;
import com.esprit.quiz.dto.NlpAnalyzeResponse;
import com.esprit.quiz.service.LanguageToolNlpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Analyse grammaticale / NLP via LanguageTool (texte uniquement).
 * Pas d'authentification pour l'instant.
 */
@RestController
@RequestMapping("/nlp")
public class NlpAnalysisController {

    private final LanguageToolNlpService languageToolNlpService;

    public NlpAnalysisController(LanguageToolNlpService languageToolNlpService) {
        this.languageToolNlpService = languageToolNlpService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<NlpAnalyzeResponse> analyze(@Valid @RequestBody NlpAnalyzeRequest request) {
        LanguageToolNlpService.NlpResult result = languageToolNlpService.analyze(
                request.getText(),
                request.getLanguage()
        );
        NlpAnalyzeResponse body = new NlpAnalyzeResponse(
                result.correctedText(),
                result.errorsCount(),
                result.score()
        );
        return ResponseEntity.ok(body);
    }
}
