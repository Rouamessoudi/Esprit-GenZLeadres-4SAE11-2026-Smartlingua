package com.esprit.adaptivelearning.adaptive.dto;

import com.esprit.adaptivelearning.entities.enums.ChapterProgressStatus;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import com.esprit.adaptivelearning.entities.enums.DifficultySeverity;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemStatus;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemType;
import com.esprit.adaptivelearning.entities.enums.LearningPathStatus;
import com.esprit.adaptivelearning.entities.enums.PreferredContentType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public class AdaptiveDtos {

    /**
     * Test final : le score provient exclusivement du module Quiz (voir {@code quizAttemptId}).
     */
    public record MeLevelTestFromQuizRequest(
            @NotNull Long quizAttemptId,
            String weakAreas
    ) {}

    public record PlacementTestSubmitRequest(
            @NotNull Long studentId,
            @NotNull @Min(0) @Max(100) Integer score,
            String weakAreas
    ) {}

    public record PlacementTestSubmitResponse(
            Long studentId,
            Integer score,
            CourseLevel assignedLevel,
            String pedagogicalInsight,
            List<RecommendationView> recommendations,
            String weakAreas,
            String learnerFullName,
            String learnerEmail,
            /** Carte « Assistant IA » : synthèse personnalisée (Spring AI ou fallback). */
            String assistantIaMessage
    ) {}

    public record GenerateLearningPathRequest(@NotNull Long studentId) {}

    public record UpdateItemStatusRequest(@NotNull LearningPathItemStatus status) {}

    public record LevelTestSubmitRequest(
            @NotNull Long studentId,
            @NotNull @Min(0) @Max(100) Integer score,
            String weakAreas,
            Long sourceQuizAttemptId
    ) {
        /** Compatibilité appels internes / legacy sans tentative Quiz. */
        public LevelTestSubmitRequest(Long studentId, Integer score, String weakAreas) {
            this(studentId, score, weakAreas, null);
        }
    }

    public record RecommendationView(
            Long id,
            Long studentId,
            LearningPathItemType itemType,
            Long refItemId,
            String itemTitle,
            String personalizedText,
            String source,
            Instant createdAt
    ) {}

    public record LearningPathItemView(
            Long id,
            Long itemId,
            LearningPathItemType itemType,
            Integer recommendedOrder,
            LearningPathItemStatus status,
            String itemTitle,
            CourseLevel courseLevel
    ) {}

    public record LearningPathView(
            Long id,
            Long studentId,
            String title,
            CourseLevel targetLevel,
            LearningPathStatus status,
            Instant createdAt,
            List<LearningPathItemView> items,
            String learnerFullName,
            String learnerEmail
    ) {}

    public record ProgressView(
            Long studentId,
            Long learningPathId,
            Integer totalItems,
            Integer completedItems,
            Double completionPercentage,
            CourseLevel currentLevel,
            Integer points,
            String badges,
            int openAlertsCount,
            String lastPromotionMessage,
            Instant lastPromotionAt,
            String learnerFullName,
            String learnerEmail,
            String aiProgressSummary
    ) {}

    public record LevelTestSubmitResponse(
            Long studentId,
            Integer score,
            boolean passed,
            CourseLevel unlockedLevel,
            String promotionMessage,
            LearningPathView newLearningPath,
            CourseLevel currentLevelAtTest,
            String learnerFullName,
            String learnerEmail,
            String aiPostTestFeedback
    ) {}

    public record ProfileView(
            Long studentId,
            CourseLevel currentLevel,
            boolean hasPlacementResult,
            CourseLevel targetLevel,
            PreferredContentType preferredContentType,
            String preferredDifficulty,
            Integer points,
            String badges,
            String lastPromotionMessage,
            Instant lastPromotionAt,
            ProgressView progress,
            List<RecommendationView> recommendations,
            List<AlertView> openAlerts,
            String learnerFullName,
            String learnerEmail,
            String aiProgressSummary
    ) {}

    public record AlertView(
            Long id,
            Long studentId,
            String reason,
            DifficultySeverity severity,
            boolean resolved,
            Instant createdAt,
            Long learningPathId,
            String learnerFullName
    ) {}

    public record CourseAccessResponse(
            boolean allowed,
            CourseLevel studentLevel,
            CourseLevel courseLevel,
            String message
    ) {}

    public record CatalogCourseRow(
            Long courseId,
            String title,
            CourseLevel courseLevel,
            boolean accessible,
            String accessMessage
    ) {}

    public record CatalogAccessOverviewDto(
            CourseLevel studentLevel,
            List<CatalogCourseRow> courses
    ) {}

    public record LearnerPickerEntry(
            long id,
            String fullName,
            String email
    ) {}

    public record TeacherAdaptiveDashboardDto(
            long studentsWithProfile,
            long activeLearningPaths,
            Double averageCompletionPercent,
            long openAlerts,
            long studentsWithOpenAlerts,
            long recommendationsLast7Days,
            long recommendationsTotalActive,
            List<AlertView> latestOpenAlerts,
            List<RecommendationView> latestRecommendations
    ) {}

    public record LearningPlanContentView(
            Long id,
            String type,
            String title,
            String url,
            boolean required
    ) {}

    public record LearningPlanChapterView(
            Long chapterId,
            String title,
            String description,
            String skillType,
            int orderIndex,
            boolean chapterRequired,
            ChapterProgressStatus progressStatus,
            Instant completedAt,
            List<LearningPlanContentView> contents
    ) {}

    public record LearningPlanSkillSectionView(
            String skillType,
            List<LearningPlanChapterView> chapters
    ) {}

    public record LearningPlanView(
            String learnerFullName,
            String learnerEmail,
            CourseLevel currentCefrLevel,
            Integer placementScore,
            double globalCompletionPercent,
            String assistantIaMessage,
            Long enrollmentId,
            Long courseId,
            String courseTitle,
            List<LearningPlanSkillSectionView> sections,
            boolean finalTestEligible
    ) {}

    public record CourseEnrollmentResultView(
            Long enrollmentId,
            Long courseId,
            String courseTitle,
            String status,
            Instant enrolledAt,
            int chaptersInitialized
    ) {}

    public record MeChapterStatusRequest(@NotNull ChapterProgressStatus status) {}
}
