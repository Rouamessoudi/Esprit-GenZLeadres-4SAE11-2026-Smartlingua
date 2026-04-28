package com.esprit.adaptivelearning.adaptive.controller;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.*;
import com.esprit.adaptivelearning.adaptive.service.AdaptiveLearningFacadeService;
import com.esprit.adaptivelearning.security.JwtUserResolver;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Alias HTTP de {@code /api/adaptive/me/...} : même logique, préfixe {@code /adaptive/me}
 * (appels directs ou proxies qui ne préfixent pas par {@code /api}).
 */
@RestController
@RequestMapping("/adaptive/me")
@PreAuthorize("isAuthenticated()")
public class AdaptiveMeAliasController {

    private final AdaptiveLearningFacadeService facade;
    private final JwtUserResolver jwtUserResolver;

    public AdaptiveMeAliasController(AdaptiveLearningFacadeService facade, JwtUserResolver jwtUserResolver) {
        this.facade = facade;
        this.jwtUserResolver = jwtUserResolver;
    }

    @PostMapping("/placement-test/start")
    public PlacementTestSubmitResponse submitPlacement(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.startPlacementTest(sid);
    }

    @PostMapping("/learning-path/generate")
    public LearningPathView generatePath(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.generateLearningPath(new GenerateLearningPathRequest(sid));
    }

    @GetMapping("/learning-path")
    public LearningPathView getPath(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.getLearningPath(sid);
    }

    @GetMapping("/progress")
    public ProgressView getProgress(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.getProgress(sid);
    }

    @PostMapping("/level-test/submit")
    public LevelTestSubmitResponse submitLevelTest(@Valid @RequestBody MeLevelTestFromQuizRequest request, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.submitLevelTestFromQuiz(sid, request.quizAttemptId(), request.weakAreas(), authentication);
    }

    @GetMapping("/profile")
    public ProfileView getProfile(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.getProfile(sid);
    }

    @GetMapping("/catalog-access")
    public CatalogAccessOverviewDto catalogAccess(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.getCatalogAccessOverview(sid);
    }

    @PostMapping("/courses/{courseId}/enroll")
    public CourseEnrollmentResultView enroll(@PathVariable Long courseId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.enrollInCourse(sid, courseId);
    }

    @GetMapping("/courses/{courseId}/learning-plan")
    public LearningPlanView learningPlan(@PathVariable Long courseId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.getLearningPlan(sid, courseId);
    }

    @PutMapping("/courses/{courseId}/chapters/{chapterId}/status")
    public LearningPlanChapterView updateChapter(
            @PathVariable Long courseId,
            @PathVariable Long chapterId,
            @Valid @RequestBody MeChapterStatusRequest request,
            Authentication authentication
    ) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return facade.updateChapterProgress(sid, courseId, chapterId, request.status(), authentication);
    }

    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<Void> resolveAlert(@PathVariable Long alertId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        facade.resolveDifficultyAlertForStudent(alertId, sid, authentication);
        return ResponseEntity.noContent().build();
    }
}
