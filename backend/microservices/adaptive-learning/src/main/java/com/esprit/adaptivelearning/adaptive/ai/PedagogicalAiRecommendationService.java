package com.esprit.adaptivelearning.adaptive.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import org.springframework.stereotype.Service;

/**
 * Spring AI (OpenAI) pour des formulations pédagogiques courtes.
 * Si le modèle n'est pas disponible ou la clé API est invalide → retourne {@code null} pour déclencher le fallback métier.
 */
@Service
public class PedagogicalAiRecommendationService {
    private static final Logger log = LoggerFactory.getLogger(PedagogicalAiRecommendationService.class);

    private final ChatModel chatModel;
    private final boolean aiEnabled;

    public PedagogicalAiRecommendationService(
            @Autowired(required = false) ChatModel chatModel,
            @Value("${adaptive.ai.enabled:true}") boolean aiEnabled
    ) {
        this.chatModel = chatModel;
        this.aiEnabled = aiEnabled;
    }

    /**
     * @return texte généré, ou {@code null} pour utiliser le fallback
     */
    public String generatePedagogicalNote(String systemContext, String userContent) {
        if (!aiEnabled || chatModel == null) {
            return null;
        }
        String prompt = """
                Tu es un conseiller pédagogique pour l'apprentissage des langues (CECRL).
                Contexte: %s
                Consigne: réponds en 2 à 4 phrases en français, ton encourageant et concret, sans markdown.
                Contenu: %s
                """.formatted(systemContext, userContent);
        try {
            ChatResponse response = chatModel.call(new Prompt(new UserMessage(prompt)));
            if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                return null;
            }
            String text = response.getResult().getOutput().getText();
            return text == null || text.isBlank() ? null : text.trim();
        } catch (Exception e) {
            log.warn("Spring AI indisponible ({}), fallback métier.", e.getClass().getSimpleName());
            return null;
        }
    }

    /** Carte « Assistant IA » après placement (visible UI). */
    public String placementAssistantSummary(CourseLevel level, int score, String weakAreas) {
        String wa = weakAreas == null || weakAreas.isBlank() ? "non précisés" : weakAreas;
        return generatePedagogicalNote(
                "Test de placement : score " + score + "/100, niveau CECRL assigné " + level + ", points faibles : " + wa + ".",
                "Rédige un court message d'accueil personnalisé (3 phrases max) : félicitations, ce que signifie ce niveau, et une action concrète pour progresser sur les points faibles."
        );
    }

    /** Feedback intelligent après test final. */
    public String postLevelTestFeedback(
            boolean passed,
            int score,
            CourseLevel before,
            CourseLevel after,
            String weakAreas
    ) {
        String wa = weakAreas == null || weakAreas.isBlank() ? "non précisés" : weakAreas;
        return generatePedagogicalNote(
                "Test de fin de niveau : " + (passed ? "réussi" : "non réussi") + ", score " + score + "/100. "
                        + "Niveau avant " + before + ", niveau après " + after + ". Points faibles : " + wa + ".",
                "Donne un feedback pédagogique bref (3 phrases) : encouragements ou conseils de révision, et prochaine étape."
        );
    }

    /** Carte « Assistant IA » sur la page Learning Plan (parcours par compétence). */
    public String learningPlanAssistant(
            CourseLevel level,
            String courseTitle,
            double readingPct,
            double writingPct,
            double listeningPct,
            String weakAreasHint
    ) {
        String wa = weakAreasHint == null || weakAreasHint.isBlank() ? "non précisés" : weakAreasHint;
        return generatePedagogicalNote(
                "Parcours cours : « " + courseTitle + " », niveau CECRL " + level
                        + ". Avancement par compétence — Reading ~" + String.format("%.0f", readingPct)
                        + "%, Writing ~" + String.format("%.0f", writingPct)
                        + "%, Listening ~" + String.format("%.0f", listeningPct)
                        + "%. Points à renforcer (placement) : " + wa + ".",
                "Propose 3 phrases : priorité sur la compétence la plus faible, une ressource type (texte, écriture, audio), ton encourageant."
        );
    }

    /** Résumé de progression pour l'écran Progression. */
    public String progressSummary(
            CourseLevel level,
            double completionPercent,
            int points,
            String badges,
            int openAlerts
    ) {
        return generatePedagogicalNote(
                "Progression apprenant : niveau " + level + ", complétion " + String.format("%.0f", completionPercent)
                        + "%, points " + points + ", badges : " + (badges == null ? "" : badges)
                        + ", alertes ouvertes : " + openAlerts + ".",
                "Synthétise en 3 phrases la situation d'apprentissage : forces, vigilance si alertes, et motivation pour la suite."
        );
    }
}
