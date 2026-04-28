package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.adaptive.ai.PedagogicalAiRecommendationService;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import org.springframework.stereotype.Service;

/**
 * Point d’entrée métier pour les messages pédagogiques personnalisés (niveau, score, points faibles).
 * Délègue à Spring AI via {@link PedagogicalAiRecommendationService} ; applique un fallback lisible si l’IA est indisponible.
 */
@Service
public class AIRecommendationService {

    private final PedagogicalAiRecommendationService springAi;

    public AIRecommendationService(PedagogicalAiRecommendationService springAi) {
        this.springAi = springAi;
    }

    public String buildPlacementAssistantMessage(CourseLevel level, int score, String weakAreas) {
        String out = springAi.placementAssistantSummary(level, score, weakAreas);
        if (out != null && !out.isBlank()) {
            return out.trim();
        }
        return fallbackPlacement(level, score, weakAreas);
    }

    public String buildProgressSummaryMessage(CourseLevel level, double completionPercent, int points, String badges, int openAlerts) {
        String out = springAi.progressSummary(level, completionPercent, points, badges, openAlerts);
        if (out != null && !out.isBlank()) {
            return out.trim();
        }
        return fallbackProgress(level, completionPercent, openAlerts);
    }

    public String buildPostLevelTestMessage(
            boolean passed,
            int score,
            CourseLevel levelBefore,
            CourseLevel levelAfter,
            String weakAreas
    ) {
        String out = springAi.postLevelTestFeedback(passed, score, levelBefore, levelAfter, weakAreas);
        if (out != null && !out.isBlank()) {
            return out.trim();
        }
        return fallbackLevelTest(passed, score, levelBefore, levelAfter, weakAreas);
    }

    public String buildLearningPlanAssistantMessage(
            CourseLevel level,
            String courseTitle,
            double readingPct,
            double writingPct,
            double listeningPct,
            String weakAreasHint
    ) {
        String out = springAi.learningPlanAssistant(level, courseTitle, readingPct, writingPct, listeningPct, weakAreasHint);
        if (out != null && !out.isBlank()) {
            return out.trim();
        }
        return fallbackLearningPlan(level, courseTitle, readingPct, writingPct, listeningPct, weakAreasHint);
    }

    private static String fallbackPlacement(CourseLevel level, int score, String weakAreas) {
        String wa = weakAreas == null || weakAreas.isBlank() ? "vos objectifs prioritaires" : weakAreas;
        return "Votre niveau " + level + " (score " + score + "/100) est enregistré. Priorisez : " + wa + ".";
    }

    private static String fallbackProgress(CourseLevel level, double pct, int alertCount) {
        String base = "Niveau " + level + ", environ " + String.format("%.0f", pct) + "% du parcours complété.";
        if (alertCount > 0) {
            return base + " Des alertes pédagogiques sont actives — consultez la section Alertes.";
        }
        return base + " Poursuivez le parcours pour consolider vos acquis.";
    }

    private static String fallbackLevelTest(
            boolean passed,
            int score,
            CourseLevel before,
            CourseLevel after,
            String weakAreas
    ) {
        if (!passed) {
            String wa = weakAreas == null || weakAreas.isBlank() ? "les objectifs du parcours" : weakAreas;
            return "Échec au test (score " + score + "%) : consolidez le niveau " + before
                    + ". Travaillez notamment : " + wa + ".";
        }
        return "Bravo pour cette réussite ! Vous progressez vers le niveau " + after
                + " ; suivez le parcours régénéré pour continuer.";
    }

    private static String fallbackLearningPlan(
            CourseLevel level,
            String courseTitle,
            double rp,
            double wp,
            double lp,
            String weak
    ) {
        String w = weak == null || weak.isBlank() ? "votre pratique régulière" : weak;
        double min = Math.min(rp, Math.min(wp, lp));
        String focus = rp == min ? "Reading (textes, vocabulaire)" : wp == min ? "Writing (production guidée)" : "Listening (audio / vidéo)";
        return "Niveau " + level + ", cours « " + courseTitle + " » : renforcez surtout " + focus
                + ". Points signalés : " + w + ".";
    }
}
