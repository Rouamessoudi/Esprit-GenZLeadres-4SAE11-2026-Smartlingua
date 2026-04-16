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
 * Analyse périodique des progressions et des échecs de test pour alimenter les alertes métier.
 */
@Component
@ConditionalOnProperty(name = "adaptive.scheduler.difficulty.enabled", havingValue = "true", matchIfMissing = true)
public class DifficultyMonitoringScheduler {
    private static final Logger log = LoggerFactory.getLogger(DifficultyMonitoringScheduler.class);

    private final StudentProgressRepository progressRepository;
    private final AdaptiveDifficultyService difficultyService;

    public DifficultyMonitoringScheduler(
            StudentProgressRepository progressRepository,
            AdaptiveDifficultyService difficultyService
    ) {
        this.progressRepository = progressRepository;
        this.difficultyService = difficultyService;
    }

    @Scheduled(cron = "${adaptive.scheduler.difficulty.cron:0 */10 * * * *}")
    public void runDifficultyScan() {
        List<StudentProgress> all = progressRepository.findAll();
        log.debug("DifficultyMonitoringScheduler: analyse de {} progressions", all.size());
        for (StudentProgress p : all) {
            difficultyService.analyzeProgressSnapshot(p);
        }
        difficultyService.scanRecentFailedTests();
    }
}
