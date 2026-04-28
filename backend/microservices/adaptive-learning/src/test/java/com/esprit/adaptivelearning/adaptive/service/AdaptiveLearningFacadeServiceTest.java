package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos;
import com.esprit.adaptivelearning.dto.external.CourseExternalDto;
import com.esprit.adaptivelearning.entities.StudentLearningProfile;
import com.esprit.adaptivelearning.entities.StudentProgress;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import com.esprit.adaptivelearning.feign.CoursesClient;
import com.esprit.adaptivelearning.feign.QuizClient;
import com.esprit.adaptivelearning.integration.AppUserLookup;
import com.esprit.adaptivelearning.integration.LearnerIdentity;
import com.esprit.adaptivelearning.repositories.*;
import com.esprit.adaptivelearning.security.AdaptiveAuthorizationService;
import com.esprit.adaptivelearning.security.JwtUserResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdaptiveLearningFacadeServiceTest {

    @Mock CoursesClient coursesClient;
    @Mock StudentLearningProfileRepository profileRepository;
    @Mock StudentPlacementTestResultRepository placementRepository;
    @Mock LearningPathRepository learningPathRepository;
    @Mock LearningPathItemRepository learningPathItemRepository;
    @Mock StudentProgressRepository progressRepository;
    @Mock StudentGamificationRepository gamificationRepository;
    @Mock StudentLevelTestResultRepository levelTestResultRepository;
    @Mock LearningDifficultyAlertRepository alertRepository;
    @Mock PedagogicalRecommendationRepository recommendationRepository;
    @Mock AdaptivePedagogyService pedagogyService;
    @Mock AdaptiveDifficultyService difficultyService;
    @Mock CourseLevelAccessPolicy accessPolicy;
    @Mock AdaptiveAuthorizationService adaptiveAuthorizationService;
    @Mock JwtUserResolver jwtUserResolver;
    @Mock AppUserLookup appUserLookup;
    @Mock AIRecommendationService aiRecommendationService;
    @Mock StudentCourseEnrollmentRepository enrollmentRepository;
    @Mock StudentChapterProgressRepository chapterProgressRepository;
    @Mock QuizClient quizClient;

    @InjectMocks AdaptiveLearningFacadeService facade;

    @BeforeEach
    void stubPedagogyDefaults() {
        lenient().when(pedagogyService.buildPlacementInsight(any(), anyInt())).thenReturn("insight");
        lenient().when(pedagogyService.buildAndStoreRecommendationsAfterLevelKnown(anyLong(), any()))
                .thenReturn(List.of());
        lenient().when(appUserLookup.findLearnerIdentity(anyLong())).thenReturn(new LearnerIdentity("Apprenant test", "test@example.com"));
        lenient().when(aiRecommendationService.buildPlacementAssistantMessage(any(), anyInt(), any())).thenReturn("Synthèse IA placement");
        lenient().when(aiRecommendationService.buildProgressSummaryMessage(any(), anyDouble(), anyInt(), any(), anyInt())).thenReturn("Synthèse IA progression");
        lenient().when(aiRecommendationService.buildPostLevelTestMessage(anyBoolean(), anyInt(), any(), any(), any())).thenReturn("Feedback IA test");
        lenient().when(enrollmentRepository.findFirstByStudentIdAndStatusOrderByEnrolledAtDesc(anyLong(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void submitPlacementTest_persistsProfileAndCallsPedagogy() {
        when(profileRepository.findByStudentId(9L)).thenReturn(Optional.empty());
        when(gamificationRepository.findByStudentId(9L)).thenReturn(Optional.empty());
        when(gamificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var req = new AdaptiveDtos.PlacementTestSubmitRequest(9L, 55, "grammar");
        var res = facade.submitPlacementTest(req);

        assertThat(res.studentId()).isEqualTo(9L);
        assertThat(res.assignedLevel()).isEqualTo(CourseLevel.B1);
        assertThat(res.pedagogicalInsight()).isEqualTo("insight");
        verify(placementRepository).save(any());
        verify(profileRepository).save(any());
        verify(pedagogyService).buildPlacementInsight(eq(CourseLevel.B1), eq(55));
        verify(pedagogyService).buildAndStoreRecommendationsAfterLevelKnown(9L, CourseLevel.B1);
    }

    @Test
    void checkCourseAccess_deniesWhenCourseHarderThanStudent() {
        var profile = new StudentLearningProfile();
        profile.setStudentId(1L);
        profile.setCurrentLevel(CourseLevel.A1);
        when(profileRepository.findByStudentId(1L)).thenReturn(Optional.of(profile));
        CourseExternalDto course = new CourseExternalDto();
        course.setId(10L);
        course.setTitle("B1 intensive");
        course.setLevel(CourseLevel.B1);
        when(coursesClient.getCourseById(10L)).thenReturn(course);
        when(accessPolicy.canAccessCourse(CourseLevel.A1, CourseLevel.B1)).thenReturn(false);

        var res = facade.checkCourseAccess(1L, 10L);

        assertThat(res.allowed()).isFalse();
        assertThat(res.courseLevel()).isEqualTo(CourseLevel.B1);
    }

    @Test
    void submitLevelTest_failsWhenPathNotComplete() {
        var p = new StudentProgress();
        p.setStudentId(1L);
        p.setTotalItems(5);
        p.setCompletedItems(2);
        when(progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(1L)).thenReturn(Optional.of(p));

        var req = new AdaptiveDtos.LevelTestSubmitRequest(1L, 80, null);
        assertThatThrownBy(() -> facade.submitLevelTest(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("test final");
    }

    @Test
    void submitLevelTest_failedRecordsDifficulty() {
        var p = new StudentProgress();
        p.setStudentId(1L);
        p.setLearningPathId(100L);
        p.setTotalItems(2);
        p.setCompletedItems(2);
        when(progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(1L)).thenReturn(Optional.of(p));
        var profile = new StudentLearningProfile();
        profile.setStudentId(1L);
        profile.setCurrentLevel(CourseLevel.A2);
        when(profileRepository.findByStudentId(1L)).thenReturn(Optional.of(profile));
        when(levelTestResultRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var res = facade.submitLevelTest(new AdaptiveDtos.LevelTestSubmitRequest(1L, 40, "verbs"));

        assertThat(res.passed()).isFalse();
        verify(difficultyService).recordFailedLevelTest(1L, 100L, 40);
    }

    @Test
    void updateItemStatus_checksAuthorization() {
        Authentication auth = mock(Authentication.class);
        when(jwtUserResolver.requireAppUserId(auth)).thenReturn(8L);
        when(adaptiveAuthorizationService.isStaff(auth)).thenReturn(false);
        var item = new com.esprit.adaptivelearning.entities.LearningPathItem();
        var path = new com.esprit.adaptivelearning.entities.LearningPath();
        path.setStudentId(7L);
        path.setId(1L);
        item.setLearningPath(path);
        item.setId(99L);
        item.setStatus(com.esprit.adaptivelearning.entities.enums.LearningPathItemStatus.PENDING);
        when(learningPathItemRepository.findById(99L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> facade.updateItemStatus(
                99L,
                new AdaptiveDtos.UpdateItemStatusRequest(com.esprit.adaptivelearning.entities.enums.LearningPathItemStatus.STARTED),
                auth
        )).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
}
