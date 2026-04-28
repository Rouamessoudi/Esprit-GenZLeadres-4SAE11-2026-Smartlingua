package com.esprit.quiz.service;

import com.esprit.quiz.dto.LevelFinalAttemptResultDto;
import com.esprit.quiz.dto.LevelFinalAttemptStartResponse;
import com.esprit.quiz.entities.LevelFinalAttempt;
import com.esprit.quiz.entities.LevelFinalAttemptStatus;
import com.esprit.quiz.repositories.LevelFinalAttemptRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * Test final de niveau : le score est toujours calculé côté serveur ({@link #completeAttempt}).
 */
@Service
public class LevelFinalQuizService {

    private static final int PASS_THRESHOLD = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String[] WEAK_HINTS_LOW = {
            "listening — compréhension orale",
            "grammaire — structures complexes",
            "reading — vocabulaire académique"
    };

    private final LevelFinalAttemptRepository repository;

    public LevelFinalQuizService(LevelFinalAttemptRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public LevelFinalAttemptStartResponse start(String keycloakSubject) {
        LevelFinalAttempt a = new LevelFinalAttempt();
        a.setKeycloakSubject(keycloakSubject);
        a.setStatus(LevelFinalAttemptStatus.IN_PROGRESS);
        a = repository.save(a);
        return new LevelFinalAttemptStartResponse(a.getId());
    }

    /**
     * Finalise la tentative : génère un score 0–100 côté serveur (simulation réaliste jusqu’à branchement QCM réels).
     */
    @Transactional
    public LevelFinalAttemptResultDto completeAttempt(long attemptId, String keycloakSubject) {
        LevelFinalAttempt a = repository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tentative introuvable"));
        if (!a.getKeycloakSubject().equals(keycloakSubject)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette tentative ne vous appartient pas");
        }
        if (a.getStatus() == LevelFinalAttemptStatus.COMPLETED) {
            return toDto(a);
        }
        int score = RANDOM.nextInt(101);
        a.setScorePercent(score);
        a.setStatus(LevelFinalAttemptStatus.COMPLETED);
        a.setCompletedAt(Instant.now());
        a.setWeakAreasAuto(buildWeakAreasAuto(score));
        repository.save(a);
        return toDto(a);
    }

    @Transactional(readOnly = true)
    public LevelFinalAttemptResultDto getResult(long attemptId, String keycloakSubject) {
        LevelFinalAttempt a = repository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tentative introuvable"));
        if (!a.getKeycloakSubject().equals(keycloakSubject)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette tentative ne vous appartient pas");
        }
        return toDto(a);
    }

    private static String buildWeakAreasAuto(int score) {
        if (score >= PASS_THRESHOLD) {
            return "";
        }
        return WEAK_HINTS_LOW[Math.floorMod(score, WEAK_HINTS_LOW.length)];
    }

    private static LevelFinalAttemptResultDto toDto(LevelFinalAttempt a) {
        boolean completed = a.getStatus() == LevelFinalAttemptStatus.COMPLETED;
        int score = a.getScorePercent() != null ? a.getScorePercent() : 0;
        boolean passed = completed && score >= PASS_THRESHOLD;
        return new LevelFinalAttemptResultDto(
                a.getId(),
                completed,
                score,
                passed,
                a.getKeycloakSubject(),
                a.getWeakAreasAuto() != null ? a.getWeakAreasAuto() : ""
        );
    }
}
