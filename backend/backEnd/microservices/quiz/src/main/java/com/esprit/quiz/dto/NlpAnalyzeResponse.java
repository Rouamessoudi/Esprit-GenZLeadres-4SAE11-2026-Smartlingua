package com.esprit.quiz.dto;

/**
 * Résultat d'analyse grammar / NLP via LanguageTool.
 */
public class NlpAnalyzeResponse {

    private String correctedText;
    private int errorsCount;
    /** Score sur 100 (plus il y a d'erreurs, plus le score baisse). */
    private int score;

    public NlpAnalyzeResponse() {
    }

    public NlpAnalyzeResponse(String correctedText, int errorsCount, int score) {
        this.correctedText = correctedText;
        this.errorsCount = errorsCount;
        this.score = score;
    }

    public String getCorrectedText() {
        return correctedText;
    }

    public void setCorrectedText(String correctedText) {
        this.correctedText = correctedText;
    }

    public int getErrorsCount() {
        return errorsCount;
    }

    public void setErrorsCount(int errorsCount) {
        this.errorsCount = errorsCount;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
