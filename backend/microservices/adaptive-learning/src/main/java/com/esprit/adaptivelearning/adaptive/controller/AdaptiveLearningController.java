package com.esprit.adaptivelearning.adaptive.controller;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.*;
import com.esprit.adaptivelearning.adaptive.service.AdaptiveLearningFacadeService;
import com.esprit.adaptivelearning.security.JwtUserResolver;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/adaptive")
public class AdaptiveLearningController {
    private final AdaptiveLearningFacadeService service;
    private final JwtUserResolver jwtUserResolver;

    public AdaptiveLearningController(AdaptiveLearningFacadeService service, JwtUserResolver jwtUserResolver) {
        this.service = service;
        this.jwtUserResolver = jwtUserResolver;
    }

    /* --- /me : identité depuis le JWT (pas de studentId dans l’URL) --- */

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/placement-test/start")
    public PlacementTestSubmitResponse submitPlacementMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.startPlacementTest(sid);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/learning-path/generate")
    public LearningPathView generatePathMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.generateLearningPath(new GenerateLearningPathRequest(sid));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/learning-path")
    public LearningPathView getPathMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.getLearningPath(sid);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/progress")
    public ProgressView getProgressMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.getProgress(sid);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/level-test/submit")
    public LevelTestSubmitResponse submitLevelTestMe(@Valid @RequestBody MeLevelTestFromQuizRequest request, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.submitLevelTestFromQuiz(sid, request.quizAttemptId(), request.weakAreas(), authentication);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/profile")
    public ProfileView getProfileMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.getProfile(sid);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/catalog-access")
    public CatalogAccessOverviewDto catalogAccessMe(Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.getCatalogAccessOverview(sid);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/courses/{courseId}/enroll")
    public CourseEnrollmentResultView enrollInCourseMe(@PathVariable Long courseId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.enrollInCourse(sid, courseId);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/courses/{courseId}/learning-plan")
    public LearningPlanView learningPlanMe(@PathVariable Long courseId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.getLearningPlan(sid, courseId);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/courses/{courseId}/chapters/{chapterId}/status")
    public LearningPlanChapterView updateChapterStatusMe(
            @PathVariable Long courseId,
            @PathVariable Long chapterId,
            @Valid @RequestBody MeChapterStatusRequest request,
            Authentication authentication
    ) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        return service.updateChapterProgress(sid, courseId, chapterId, request.status(), authentication);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/alerts/{alertId}/resolve")
    public ResponseEntity<Void> resolveAlertMe(@PathVariable Long alertId, Authentication authentication) {
        long sid = jwtUserResolver.requireAppUserId(authentication);
        service.resolveDifficultyAlertForStudent(alertId, sid, authentication);
        return ResponseEntity.noContent().build();
    }

    /* --- API avec studentId explicite (compatibilité) --- */

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#request.studentId(), authentication)")
    @PostMapping("/placement-test/submit")
    public PlacementTestSubmitResponse submitPlacementTest(@Valid @RequestBody PlacementTestSubmitRequest request) {
        return service.submitPlacementTest(request);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#request.studentId(), authentication)")
    @PostMapping("/learning-path/generate")
    public LearningPathView generateLearningPath(@Valid @RequestBody GenerateLearningPathRequest request) {
        return service.generateLearningPath(request);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#studentId, authentication)")
    @GetMapping("/learning-path/{studentId}")
    public LearningPathView getLearningPath(@PathVariable Long studentId) {
        return service.getLearningPath(studentId);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/learning-path/item/{itemId}/status")
    public LearningPathItemView updateLearningPathItemStatus(@PathVariable Long itemId,
                                                             @Valid @RequestBody UpdateItemStatusRequest request,
                                                             Authentication authentication) {
        return service.updateItemStatus(itemId, request, authentication);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#studentId, authentication)")
    @GetMapping("/progress/{studentId}")
    public ProgressView getProgress(@PathVariable Long studentId) {
        return service.getProgress(studentId);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#request.studentId(), authentication)")
    @PostMapping("/level-test/submit")
    public LevelTestSubmitResponse submitLevelTest(@Valid @RequestBody LevelTestSubmitRequest request) {
        return service.submitLevelTest(request);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#studentId, authentication)")
    @GetMapping("/profile/{studentId}")
    public ProfileView getProfile(@PathVariable Long studentId) {
        return service.getProfile(studentId);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#studentId, authentication)")
    @GetMapping("/access/course/{studentId}/{courseId}")
    public CourseAccessResponse checkCourseAccess(@PathVariable Long studentId, @PathVariable Long courseId) {
        return service.checkCourseAccess(studentId, courseId);
    }

    @PreAuthorize("@adaptiveAuth.canAccessStudent(#studentId, authentication)")
    @GetMapping("/catalog-access/{studentId}")
    public CatalogAccessOverviewDto catalogAccessOverview(@PathVariable Long studentId) {
        return service.getCatalogAccessOverview(studentId);
    }
}
