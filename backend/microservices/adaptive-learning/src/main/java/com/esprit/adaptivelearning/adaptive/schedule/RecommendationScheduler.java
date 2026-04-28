package com.esprit.adaptivelearning.adaptive.schedule;

import com.esprit.adaptivelearning.adaptive.service.AdaptivePedagogyService;
import com.esprit.adaptivelearning.entities.StudentLearningProfile;
import com.esprit.adaptivelearning.entities.StudentProgress;
import com.esprit.adaptivelearning.repositories.LearningDifficultyAlertRepository;
import com.esprit.adaptivelearning.repositories.StudentLearningProfileRepository;
import com.esprit.adaptivelearning.repositories.StudentProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Régénère des recommandations pour les profils en difficulté ou peu actifs.
 */
@Component
@ConditionalOnProperty(name = "adaptive.scheduler.recommendation.enabled", havingValue = "true", matchIfMissing = true)
public class RecommendationScheduler {
    private static final Logger log = LoggerFactory.getLogger(RecommendationScheduler.class);

    private final StudentLearningProfileRepository profileRepository;
    private final StudentProgressRepository progressRepository;
    private final LearningDifficultyAlertRepository alertRepository;
    private final AdaptivePedagogyService pedagogyService;

    public RecommendationScheduler(
            StudentLearningProfileRepository profileRepository,
            StudentProgressRepository progressRepository,
            LearningDifficultyAlertRepository alertRepository,
            AdaptivePedagogyService pedagogyService
    ) {
        this.profileRepository = profileRepository;
        this.progressRepository = progressRepository;
        this.alertRepository = alertRepository;
        this.pedagogyService = pedagogyService;
    }

    @Scheduled(cron = "${adaptive.scheduler.recommendation.cron:0 15 * * * *}")
    public void runRecommendationSweep() {
        Instant cutoff = Instant.now().minus(14, ChronoUnit.DAYS);
        for (StudentLearningProfile profile : profileRepository.findAll()) {
            Long sid = profile.getStudentId();
            Optional<StudentProgress> opt = progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(sid);
            boolean openAlerts = alertRepository.countByStudentIdAndResolvedFalse(sid) > 0;
            boolean struggling = opt.map(this::isStrugglingProgress).orElse(true);
            boolean inactive = opt.map(p -> isInactive(p, cutoff)).orElse(true);
            if (openAlerts || struggling || inactive) {
                log.debug("RecommendationScheduler: génération pour étudiant {} (alertes={}, difficile={}, inactif={})",
                        sid, openAlerts, struggling, inactive);
                pedagogyService.generateRecommendationsForStrugglingStudent(profile);
            }
        }
    }

    private boolean isStrugglingProgress(StudentProgress p) {
        if (p.getTotalItems() == null || p.getTotalItems() == 0) {
            return false;
        }
        double pct = p.getCompletionPercentage() != null ? p.getCompletionPercentage() : 0.0;
        int pending = p.getTotalItems() - (p.getCompletedItems() != null ? p.getCompletedItems() : 0);
        return pct < 45.0 && pending >= 2;
    }

    private boolean isInactive(StudentProgress p, Instant cutoff) {
        if (p.getUpdatedAt() == null) {
            return true;
        }
        double pct = p.getCompletionPercentage() != null ? p.getCompletionPercentage() : 0.0;
        return p.getUpdatedAt().isBefore(cutoff) && pct < 95.0;
    }
}
