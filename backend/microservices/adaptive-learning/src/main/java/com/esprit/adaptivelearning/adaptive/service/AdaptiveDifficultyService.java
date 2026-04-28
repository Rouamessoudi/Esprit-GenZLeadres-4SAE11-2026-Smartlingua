package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.entities.LearningDifficultyAlert;
import com.esprit.adaptivelearning.entities.StudentLevelTestResult;
import com.esprit.adaptivelearning.entities.StudentProgress;
import com.esprit.adaptivelearning.entities.enums.DifficultySeverity;
import com.esprit.adaptivelearning.repositories.LearningDifficultyAlertRepository;
import com.esprit.adaptivelearning.repositories.StudentLevelTestResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AdaptiveDifficultyService {
    public static final String PREFIX_SLOW = "[SLOW_PROGRESS]";
    public static final String PREFIX_INACTIVE = "[INACTIVITY]";
    public static final String PREFIX_FAIL_TEST = "[LEVEL_TEST_FAIL]";

    private final LearningDifficultyAlertRepository alertRepository;
    private final StudentLevelTestResultRepository levelTestResultRepository;

    public AdaptiveDifficultyService(
            LearningDifficultyAlertRepository alertRepository,
            StudentLevelTestResultRepository levelTestResultRepository
    ) {
        this.alertRepository = alertRepository;
        this.levelTestResultRepository = levelTestResultRepository;
    }

    @Transactional
    public void analyzeProgressSnapshot(StudentProgress p) {
        if (p.getTotalItems() == null || p.getTotalItems() == 0) {
            return;
        }
        double pct = p.getCompletionPercentage() != null ? p.getCompletionPercentage() : 0.0;
        int pending = p.getTotalItems() - (p.getCompletedItems() != null ? p.getCompletedItems() : 0);
        if (pct < 30.0 && pending >= 3) {
            createIfAbsent(p.getStudentId(), p.getLearningPathId(), PREFIX_SLOW, DifficultySeverity.MEDIUM,
                    PREFIX_SLOW + " Progression faible (" + String.format("%.0f", pct) + "%). "
                            + pending + " étapes encore à traiter — prévoir un accompagnement ou un rythme adapté.");
        }
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        if ((p.getCompletedItems() == null || p.getCompletedItems() == 0)
                && p.getUpdatedAt() != null && p.getUpdatedAt().isBefore(weekAgo)) {
            createIfAbsent(p.getStudentId(), p.getLearningPathId(), PREFIX_INACTIVE, DifficultySeverity.LOW,
                    PREFIX_INACTIVE + " Aucune étape complétée depuis plus de 7 jours — risque de désengagement.");
        }
    }

    @Transactional
    public void recordFailedLevelTest(Long studentId, Long learningPathId, int score) {
        createIfAbsent(studentId, learningPathId, PREFIX_FAIL_TEST, DifficultySeverity.HIGH,
                PREFIX_FAIL_TEST + " Test de fin de niveau non réussi (score " + score + "%). Révision recommandée.");
    }

    @Transactional
    public void flagLowProgressAfterItemUpdate(StudentProgress p) {
        if (p.getTotalItems() == null || p.getTotalItems() == 0) {
            return;
        }
        double pct = p.getCompletionPercentage() != null ? p.getCompletionPercentage() : 0;
        int pending = p.getTotalItems() - (p.getCompletedItems() != null ? p.getCompletedItems() : 0);
        if (pct < 20.0 && pending >= 5) {
            createIfAbsent(p.getStudentId(), p.getLearningPathId(), PREFIX_SLOW, DifficultySeverity.HIGH,
                    PREFIX_SLOW + " Avancement très lent (" + String.format("%.0f", pct) + "%) avec "
                            + pending + " étapes restantes.");
        }
    }

    /** Complète l'analyse planifiée : échecs de test récents non encore signalés par alerte ouverte. */
    @Transactional
    public void scanRecentFailedTests() {
        Instant since = Instant.now().minus(14, ChronoUnit.DAYS);
        for (StudentLevelTestResult r : levelTestResultRepository.findAll()) {
            if (Boolean.FALSE.equals(r.getPassed()) && r.getTestDate() != null && r.getTestDate().isAfter(since)) {
                createIfAbsent(r.getStudentId(), null, PREFIX_FAIL_TEST, DifficultySeverity.MEDIUM,
                        PREFIX_FAIL_TEST + " Échec récent en test de niveau — suivi pédagogique.");
            }
        }
    }

    private void createIfAbsent(Long studentId, Long learningPathId, String prefix, DifficultySeverity severity, String reason) {
        if (alertRepository.existsByStudentIdAndResolvedFalseAndReasonStartingWith(studentId, prefix)) {
            return;
        }
        LearningDifficultyAlert a = new LearningDifficultyAlert();
        a.setStudentId(studentId);
        a.setLearningPathId(learningPathId);
        a.setSeverity(severity);
        a.setReason(reason);
        a.setResolved(false);
        a.setCreatedAt(Instant.now());
        alertRepository.save(a);
    }
}
