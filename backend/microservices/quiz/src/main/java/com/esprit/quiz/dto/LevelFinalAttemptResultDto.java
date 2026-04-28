package com.esprit.quiz.dto;

public record LevelFinalAttemptResultDto(
        long attemptId,
        boolean completed,
        int scorePercent,
        boolean passed,
        String keycloakSubject,
        String weakAreasAuto
) {}
