package com.esprit.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corps attendu pour l'analyse NLP (texte uniquement, pas d'audio).
 */
public class NlpAnalyzeRequest {

    @NotBlank(message = "Le texte est obligatoire.")
    @Size(max = 50000, message = "Le texte est trop long.")
    private String text;

    /** Code langue LanguageTool, ex. en-US, fr, auto — défaut en-US si absent. */
    private String language;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
