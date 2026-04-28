package com.esprit.adaptivelearning.adaptive.schedule;

import com.esprit.adaptivelearning.adaptive.service.AdaptiveDifficultyService;
import com.esprit.adaptivelearning.entities.StudentProgress;
import com.esprit.adaptivelearning.repositories.StudentProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Analyse périodique simple des progressions et création d’alertes si la progression reste faible.
 * Complète {@link DifficultyMonitoringScheduler} (peut être désactivé via propriétés pour éviter doublons).
 */
@Component
@ConditionalOnProperty(name = "adaptive.scheduler.simple-progress.enabled", havingValue = "true", matchIfMissing = true)
public class SimpleProgressAlertScheduler {
    private static final Logger log = LoggerFactory.getLogger(SimpleProgressAlertScheduler.class);

    private final StudentProgressRepository progressRepository;
    private final AdaptiveDifficultyService difficultyService;

    public SimpleProgressAlertScheduler(
            StudentProgressRepository progressRepository,
            AdaptiveDifficultyService difficultyService
    ) {
        this.progressRepository = progressRepository;
        this.difficultyService = difficultyService;
    }

    @Scheduled(cron = "${adaptive.scheduler.simple-progress.cron:0 25 * * * *}")
    public void scanLowProgress() {
        List<StudentProgress> all = progressRepository.findAll();
        log.debug("SimpleProgressAlertScheduler: analyse de {} progressions", all.size());
        for (StudentProgress p : all) {
            difficultyService.analyzeProgressSnapshot(p);
        }
        difficultyService.scanRecentFailedTests();
    }
}
