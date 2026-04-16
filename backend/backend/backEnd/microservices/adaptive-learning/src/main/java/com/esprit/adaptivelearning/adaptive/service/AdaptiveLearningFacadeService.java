package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.*;
import com.esprit.adaptivelearning.dto.external.quiz.QuizLevelFinalResultDto;
import com.esprit.adaptivelearning.dto.external.ChapterContentExternalDto;
import com.esprit.adaptivelearning.dto.external.ChapterExternalDto;
import com.esprit.adaptivelearning.dto.external.CourseExternalDto;
import com.esprit.adaptivelearning.dto.external.ResourceExternalDto;
import com.esprit.adaptivelearning.dto.external.SeanceExternalDto;
import com.esprit.adaptivelearning.entities.*;
import com.esprit.adaptivelearning.entities.enums.ChapterProgressStatus;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import com.esprit.adaptivelearning.entities.enums.EnrollmentStatus;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemStatus;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemType;
import com.esprit.adaptivelearning.entities.enums.LearningPathStatus;
import com.esprit.adaptivelearning.entities.enums.PreferredContentType;
import com.esprit.adaptivelearning.exceptions.NotFoundException;
import com.esprit.adaptivelearning.feign.CoursesClient;
import com.esprit.adaptivelearning.feign.QuizClient;
import com.esprit.adaptivelearning.integration.AppUserLookup;
import com.esprit.adaptivelearning.integration.LearnerIdentity;
import com.esprit.adaptivelearning.repositories.*;
import com.esprit.adaptivelearning.security.AdaptiveAuthorizationService;
import com.esprit.adaptivelearning.security.JwtUserResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class AdaptiveLearningFacadeService {
    private final CoursesClient coursesClient;
    private final StudentLearningProfileRepository profileRepository;
    private final StudentPlacementTestResultRepository placementRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningPathItemRepository learningPathItemRepository;
    private final StudentProgressRepository progressRepository;
    private final StudentGamificationRepository gamificationRepository;
    private final StudentLevelTestResultRepository levelTestResultRepository;
    private final LearningDifficultyAlertRepository alertRepository;
    private final PedagogicalRecommendationRepository recommendationRepository;
    private final AdaptivePedagogyService pedagogyService;
    private final AdaptiveDifficultyService difficultyService;
    private final CourseLevelAccessPolicy accessPolicy;
    private final AdaptiveAuthorizationService adaptiveAuthorizationService;
    private final JwtUserResolver jwtUserResolver;
    private final AppUserLookup appUserLookup;
    private final AIRecommendationService aiRecommendationService;
    private final StudentCourseEnrollmentRepository enrollmentRepository;
    private final StudentChapterProgressRepository chapterProgressRepository;
    private final QuizClient quizClient;

    public AdaptiveLearningFacadeService(
            CoursesClient coursesClient,
            StudentLearningProfileRepository profileRepository,
            StudentPlacementTestResultRepository placementRepository,
            LearningPathRepository learningPathRepository,
            LearningPathItemRepository learningPathItemRepository,
            StudentProgressRepository progressRepository,
            StudentGamificationRepository gamificationRepository,
            StudentLevelTestResultRepository levelTestResultRepository,
            LearningDifficultyAlertRepository alertRepository,
            PedagogicalRecommendationRepository recommendationRepository,
            AdaptivePedagogyService pedagogyService,
            AdaptiveDifficultyService difficultyService,
            CourseLevelAccessPolicy accessPolicy,
            AdaptiveAuthorizationService adaptiveAuthorizationService,
            JwtUserResolver jwtUserResolver,
            AppUserLookup appUserLookup,
            AIRecommendationService aiRecommendationService,
            StudentCourseEnrollmentRepository enrollmentRepository,
            StudentChapterProgressRepository chapterProgressRepository,
            QuizClient quizClient
    ) {
        this.coursesClient = coursesClient;
        this.profileRepository = profileRepository;
        this.placementRepository = placementRepository;
        this.learningPathRepository = learningPathRepository;
        this.learningPathItemRepository = learningPathItemRepository;
        this.progressRepository = progressRepository;
        this.gamificationRepository = gamificationRepository;
        this.levelTestResultRepository = levelTestResultRepository;
        this.alertRepository = alertRepository;
        this.recommendationRepository = recommendationRepository;
        this.pedagogyService = pedagogyService;
        this.difficultyService = difficultyService;
        this.accessPolicy = accessPolicy;
        this.adaptiveAuthorizationService = adaptiveAuthorizationService;
        this.jwtUserResolver = jwtUserResolver;
        this.appUserLookup = appUserLookup;
        this.aiRecommendationService = aiRecommendationService;
        this.enrollmentRepository = enrollmentRepository;
        this.chapterProgressRepository = chapterProgressRepository;
        this.quizClient = quizClient;
    }

    /**
     * Enregistre le test final à partir d'une tentative {@link QuizClient} validée (score jamais fourni par le navigateur).
     */
    @Transactional
    public LevelTestSubmitResponse submitLevelTestFromQuiz(
            long studentId,
            long quizAttemptId,
            String weakAreasOptional,
            Authentication authentication
    ) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("JWT manquant");
        }
        String sub = jwt.getSubject();
        QuizLevelFinalResultDto quiz;
        try {
            quiz = quizClient.getLevelFinalAttempt(quizAttemptId);
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Impossible de joindre ou de valider le module Quiz (Eureka, port 8088, JWT). " + e.getMessage());
        }
        if (quiz.getKeycloakSubject() == null || !sub.equals(quiz.getKeycloakSubject())) {
            throw new AccessDeniedException("Cette tentative ne correspond pas à votre session.");
        }
        if (!quiz.isCompleted()) {
            throw new IllegalArgumentException(
                    "Le quiz doit être finalisé côté serveur (étape « terminer ») avant l'enregistrement sur le parcours.");
        }
        if (levelTestResultRepository.existsByQuizAttemptId(quizAttemptId)) {
            throw new IllegalArgumentException("Ce résultat de quiz a déjà été enregistré.");
        }
        String merged = (weakAreasOptional != null && !weakAreasOptional.isBlank())
                ? weakAreasOptional
                : (quiz.getWeakAreasAuto() != null ? quiz.getWeakAreasAuto() : "");
        return submitLevelTest(new LevelTestSubmitRequest(studentId, quiz.getScorePercent(), merged, quizAttemptId));
    }

    @Transactional
    public PlacementTestSubmitResponse startPlacementTest(long studentId) {
        if (placementRepository.existsByStudentId(studentId)) {
            throw new IllegalArgumentException(
                    "Le test de placement est réservé aux nouveaux étudiants. Utilisez le test final pour évoluer de niveau.");
        }
        int simulatedScore = ThreadLocalRandom.current().nextInt(0, 101);
        return submitPlacementTest(new PlacementTestSubmitRequest(studentId, simulatedScore, null));
    }

    @Transactional
    public PlacementTestSubmitResponse submitPlacementTest(PlacementTestSubmitRequest request) {
        if (placementRepository.existsByStudentId(request.studentId())) {
            throw new IllegalArgumentException(
                    "Le test de placement est déjà effectué pour cet étudiant. Utilisez le test final pour changer de niveau.");
        }
        CourseLevel assigned = levelFromScore(request.score());
        Instant now = Instant.now();
        StudentPlacementTestResult testResult = new StudentPlacementTestResult();
        testResult.setStudentId(request.studentId());
        testResult.setScore(request.score());
        testResult.setAssignedLevel(assigned);
        testResult.setWeakAreas(request.weakAreas());
        testResult.setTestDate(now);
        testResult.setCreatedAt(now);
        placementRepository.save(testResult);

        StudentLearningProfile profile = profileRepository.findByStudentId(request.studentId())
                .orElseGet(StudentLearningProfile::new);
        profile.setStudentId(request.studentId());
        profile.setCurrentLevel(assigned);
        profile.setTargetLevel(nextLevel(assigned));
        profile.setPreferredContentType(PreferredContentType.ANY);
        if (profile.getPreferredDifficulty() == null || profile.getPreferredDifficulty().isBlank()) {
            profile.setPreferredDifficulty("MEDIUM");
        }
        if (profile.getLearningGoal() == null) {
            profile.setLearningGoal("");
        }
        profileRepository.save(profile);

        gamificationRepository.findByStudentId(request.studentId()).orElseGet(() -> {
            StudentGamification g = new StudentGamification();
            g.setStudentId(request.studentId());
            return gamificationRepository.save(g);
        });

        String insight = pedagogyService.buildPlacementInsight(assigned, request.score());
        List<RecommendationView> recommendations = safeRecommendationsAfterPlacement(request.studentId(), assigned);
        LearnerIdentity id = safeLearnerIdentity(request.studentId());
        String assistantIa = safePlacementAssistantMessage(assigned, request.score(), request.weakAreas());

        return new PlacementTestSubmitResponse(
                request.studentId(),
                request.score(),
                assigned,
                insight,
                recommendations,
                request.weakAreas(),
                id.fullName(),
                id.email(),
                assistantIa
        );
    }

    @Transactional
    public LearningPathView generateLearningPath(GenerateLearningPathRequest request) {
        if (!placementRepository.existsByStudentId(request.studentId())) {
            throw new IllegalArgumentException(
                    "Test de placement requis avant la génération du parcours. Ouvrez d'abord 'Mon niveau' et passez le test.");
        }
        StudentLearningProfile profile = profileRepository.findByStudentId(request.studentId())
                .orElseThrow(() -> new NotFoundException(
                        "Student profile not found for student " + request.studentId() + ". Submit placement test first."));
        CourseLevel effectiveLevel = profile.getCurrentLevel();
        CourseLevel effectiveTarget = profile.getTargetLevel() != null ? profile.getTargetLevel() : nextLevel(effectiveLevel);
        if (profile.getTargetLevel() == null) {
            profile.setTargetLevel(effectiveTarget);
            profileRepository.save(profile);
        }

        LearningPath path = new LearningPath();
        path.setStudentId(request.studentId());
        path.setTitle("Learning path - " + effectiveLevel);
        path.setGoal("Consolidation " + effectiveLevel + " -> objectif " + effectiveTarget);
        path.setTargetLevel(effectiveLevel);
        path.setStatus(LearningPathStatus.ACTIVE);
        path.setCreatedAt(Instant.now());
        path.setUpdatedAt(Instant.now());

        List<CourseExternalDto> courses = safeCoursesByLevel(effectiveLevel);
        List<LearningPathItem> items = new ArrayList<>();
        int order = 1;
        for (CourseExternalDto course : courses) {
            items.add(buildItem(path, LearningPathItemType.COURSE, course.getId(), order++, course.getId()));
            for (ResourceExternalDto resource : safeResourcesByCourse(course.getId())) {
                items.add(buildItem(path, LearningPathItemType.RESOURCE, resource.getId(), order++, course.getId()));
            }
            for (SeanceExternalDto seance : safeSeancesByCourse(course.getId())) {
                items.add(buildItem(path, LearningPathItemType.SESSION, seance.getId(), order++, course.getId()));
            }
        }

        path.setItems(items);
        LearningPath savedPath = learningPathRepository.save(path);

        StudentProgress progress = progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(request.studentId())
                .orElseGet(StudentProgress::new);
        progress.setStudentId(request.studentId());
        progress.setLearningPathId(savedPath.getId());
        progress.setTotalItems(items.size());
        progress.setCompletedItems(0);
        progress.setCompletionPercentage(0.0);
        progress.setCurrentLevel(effectiveLevel);
        progress.setUpdatedAt(Instant.now());
        progressRepository.save(progress);

        pedagogyService.buildAndStoreRecommendationsAfterLevelKnown(request.studentId(), effectiveLevel);
        difficultyService.analyzeProgressSnapshot(progress);

        return toLearningPathView(savedPath);
    }

    @Transactional
    public LearningPathView getLearningPath(Long studentId) {
        Optional<LearningPath> existing = learningPathRepository.findFirstWithItemsByStudentIdOrderByCreatedAtDesc(studentId);
        if (existing.isPresent()) {
            return toLearningPathView(existing.get());
        }
        throw new NotFoundException("Learning path not found for student " + studentId);
    }

    @Transactional
    public LearningPathItemView updateItemStatus(Long itemId, UpdateItemStatusRequest request, Authentication authentication) {
        LearningPathItem item = learningPathItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Learning path item not found: " + itemId));
        Long pathStudentId = item.getLearningPath().getStudentId();
        long callerAppUserId = jwtUserResolver.requireAppUserId(authentication);
        if (!pathStudentId.equals(callerAppUserId) && !adaptiveAuthorizationService.isStaff(authentication)) {
            throw new AccessDeniedException("Ce parcours ne correspond pas à votre compte.");
        }
        LearningPathItemStatus current = item.getStatus();
        validateTransition(current, request.status());
        item.setStatus(request.status());
        learningPathItemRepository.save(item);

        Long studentId = item.getLearningPath().getStudentId();
        StudentProgress progress = progressRepository.findByLearningPathId(item.getLearningPath().getId())
                .orElseThrow(() -> new NotFoundException("Progress not found for learning path"));
        long doneCount = learningPathItemRepository.findByLearningPath_IdOrderByRecommendedOrderAsc(item.getLearningPath().getId())
                .stream().filter(i -> i.getStatus() == LearningPathItemStatus.DONE).count();
        progress.setCompletedItems((int) doneCount);
        progress.setCompletionPercentage(progress.getTotalItems() == 0 ? 0.0 : (doneCount * 100.0) / progress.getTotalItems());
        progress.setUpdatedAt(Instant.now());
        progressRepository.save(progress);

        if (current != LearningPathItemStatus.DONE && request.status() == LearningPathItemStatus.DONE) {
            addPoints(studentId, 10);
        }

        difficultyService.flagLowProgressAfterItemUpdate(progress);
        difficultyService.analyzeProgressSnapshot(progress);

        return toLearningPathItemView(item);
    }

    @Transactional(readOnly = true)
    public ProgressView getProgress(Long studentId) {
        StudentProgress progress = progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(studentId)
                .orElseThrow(() -> new NotFoundException("Progress not found for student " + studentId));
        StudentGamification gamification = gamificationRepository.findByStudentId(studentId)
                .orElseGet(StudentGamification::new);
        long alerts = alertRepository.countByStudentIdAndResolvedFalse(studentId);
        LearnerIdentity id = appUserLookup.findLearnerIdentity(studentId);
        double pct = progress.getCompletionPercentage() != null ? progress.getCompletionPercentage() : 0.0;
        String aiSum = aiRecommendationService.buildProgressSummaryMessage(
                progress.getCurrentLevel(),
                pct,
                gamification.getPoints() == null ? 0 : gamification.getPoints(),
                gamification.getBadges(),
                (int) alerts
        );
        return new ProgressView(
                studentId,
                progress.getLearningPathId(),
                progress.getTotalItems(),
                progress.getCompletedItems(),
                progress.getCompletionPercentage(),
                progress.getCurrentLevel(),
                gamification.getPoints() == null ? 0 : gamification.getPoints(),
                gamification.getBadges() == null ? "" : gamification.getBadges(),
                (int) alerts,
                gamification.getLastPromotionMessage(),
                gamification.getLastPromotionAt(),
                id.fullName(),
                id.email(),
                aiSum
        );
    }

    @Transactional
    public LevelTestSubmitResponse submitLevelTest(LevelTestSubmitRequest request) {
        if (request.sourceQuizAttemptId() != null && levelTestResultRepository.existsByQuizAttemptId(request.sourceQuizAttemptId())) {
            throw new IllegalArgumentException("Ce résultat de quiz a déjà été enregistré.");
        }
        StudentProgress progress = getOrCreateProgressForLevelTest(request.studentId());
        // Flux Quiz: si une tentative Quiz validée est fournie, on autorise l'enregistrement
        // du résultat dans le parcours sans bloquer sur les anciennes préconditions du path.
        boolean fromQuiz = request.sourceQuizAttemptId() != null;
        if (!fromQuiz && !isFinalTestEligible(request.studentId())) {
            throw new IllegalArgumentException(
                    "Le test final n'est disponible que lorsque tous les chapitres obligatoires (Reading, Writing, Listening) "
                            + "sont terminés pour votre cours inscrit (niveau actuel), ou lorsque l'ancien parcours global est entièrement complété.");
        }

        StudentLearningProfile profile = profileRepository.findByStudentId(request.studentId())
                .orElseThrow(() -> new NotFoundException("Student profile not found for student " + request.studentId()));
        CourseLevel levelBefore = profile.getCurrentLevel();
        boolean passed = request.score() >= 60;
        CourseLevel unlockedLevel = passed ? nextLevel(profile.getCurrentLevel()) : profile.getCurrentLevel();

        Instant levelTestNow = Instant.now();
        StudentLevelTestResult result = new StudentLevelTestResult();
        result.setStudentId(request.studentId());
        result.setCurrentLevel(profile.getCurrentLevel());
        result.setScore(request.score());
        result.setPassed(passed);
        result.setUnlockedLevel(unlockedLevel);
        result.setWeakAreas(request.weakAreas());
        result.setQuizAttemptId(request.sourceQuizAttemptId());
        result.setTestDate(levelTestNow);
        result.setCreatedAt(levelTestNow);
        levelTestResultRepository.save(result);

        if (!passed) {
            difficultyService.recordFailedLevelTest(
                    request.studentId(),
                    progress.getLearningPathId(),
                    request.score()
            );
            LearnerIdentity idFail = appUserLookup.findLearnerIdentity(request.studentId());
            String aiFail = aiRecommendationService.buildPostLevelTestMessage(
                    false, request.score(), levelBefore, profile.getCurrentLevel(), request.weakAreas());
            return new LevelTestSubmitResponse(
                    request.studentId(),
                    request.score(),
                    false,
                    profile.getCurrentLevel(),
                    "Test non réussi. Révisez les points faibles indiqués puis retentez lorsque vous êtes prêt.",
                    null,
                    levelBefore,
                    idFail.fullName(),
                    idFail.email(),
                    aiFail
            );
        }

        profile.setCurrentLevel(unlockedLevel);
        profile.setTargetLevel(nextLevel(unlockedLevel));
        profileRepository.save(profile);

        addPoints(request.studentId(), 50);
        applyPromotionGamification(request.studentId(), levelBefore, unlockedLevel);

        LearningPathView regenerated = generateLearningPath(new GenerateLearningPathRequest(request.studentId()));
        pedagogyService.buildAndStoreRecommendationsAfterLevelKnown(request.studentId(), unlockedLevel);

        String promo = String.format(
                "Félicitations ! Vous passez du niveau %s au niveau %s. Un nouveau parcours a été généré.",
                levelBefore,
                unlockedLevel
        );
        LearnerIdentity idOk = appUserLookup.findLearnerIdentity(request.studentId());
        String aiOk = aiRecommendationService.buildPostLevelTestMessage(
                true, request.score(), levelBefore, unlockedLevel, request.weakAreas());
        return new LevelTestSubmitResponse(
                request.studentId(),
                request.score(),
                true,
                unlockedLevel,
                promo,
                regenerated,
                levelBefore,
                idOk.fullName(),
                idOk.email(),
                aiOk
        );
    }

    private StudentProgress getOrCreateProgressForLevelTest(Long studentId) {
        Optional<StudentProgress> existing = progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(studentId);
        if (existing.isPresent()) {
            return existing.get();
        }
        // Premier test final sans progression existante : on génère un parcours initial
        // pour conserver la cohérence métier et permettre l'enregistrement du résultat.
        generateLearningPath(new GenerateLearningPathRequest(studentId));
        return progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(studentId)
                .orElseThrow(() -> new NotFoundException("Progress not found for student " + studentId));
    }

    private List<RecommendationView> safeRecommendationsAfterPlacement(Long studentId, CourseLevel assigned) {
        try {
            return pedagogyService.buildAndStoreRecommendationsAfterLevelKnown(studentId, assigned);
        } catch (Exception e) {
            return List.of();
        }
    }

    private String safePlacementAssistantMessage(CourseLevel assigned, int score, String weakAreas) {
        try {
            return aiRecommendationService.buildPlacementAssistantMessage(assigned, score, weakAreas);
        } catch (Exception e) {
            return "Niveau estime: " + assigned + ". Commencez par un rythme regulier sur les contenus recommandes.";
        }
    }

    private LearnerIdentity safeLearnerIdentity(Long studentId) {
        try {
            return appUserLookup.findLearnerIdentity(studentId);
        } catch (Exception e) {
            return LearnerIdentity.empty();
        }
    }

    @Transactional
    public ProfileView getProfile(Long studentId) {
        StudentLearningProfile profile = profileRepository.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("Student profile not found for student " + studentId));
        ensureMinimumTargetLevel(profile);
        StudentGamification gamification = gamificationRepository.findByStudentId(studentId).orElseGet(StudentGamification::new);
        ProgressView progressView = null;
        if (progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(studentId).isPresent()) {
            progressView = getProgress(studentId);
        }
        List<RecommendationView> recs = pedagogyService.listActiveForStudent(studentId);
        List<AlertView> alerts = alertRepository.findByStudentIdAndResolvedFalseOrderByCreatedAtDesc(studentId).stream()
                .map(this::toAlertView)
                .toList();
        boolean hasPlacementResult = placementRepository.findTopByStudentIdOrderByTestDateDesc(studentId).isPresent();
        LearnerIdentity id = appUserLookup.findLearnerIdentity(studentId);
        String aiProfile = progressView != null ? progressView.aiProgressSummary() : null;
        if (aiProfile == null || aiProfile.isBlank()) {
            double pctf = progressView != null && progressView.completionPercentage() != null ? progressView.completionPercentage() : 0;
            aiProfile = aiRecommendationService.buildProgressSummaryMessage(
                    profile.getCurrentLevel(),
                    pctf,
                    gamification.getPoints() == null ? 0 : gamification.getPoints(),
                    gamification.getBadges(),
                    alerts.size());
        }
        return new ProfileView(
                studentId,
                profile.getCurrentLevel(),
                hasPlacementResult,
                profile.getTargetLevel(),
                profile.getPreferredContentType(),
                profile.getPreferredDifficulty(),
                gamification.getPoints() == null ? 0 : gamification.getPoints(),
                gamification.getBadges() == null ? "" : gamification.getBadges(),
                gamification.getLastPromotionMessage(),
                gamification.getLastPromotionAt(),
                progressView,
                recs,
                alerts,
                id.fullName(),
                id.email(),
                aiProfile
        );
    }

    @Transactional(readOnly = true)
    public CourseAccessResponse checkCourseAccess(Long studentId, Long courseId) {
        StudentLearningProfile profile = profileRepository.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("Student profile not found for student " + studentId));
        CourseExternalDto course;
        try {
            course = coursesClient.getCourseById(courseId);
        } catch (Exception e) {
            throw new NotFoundException("Course not found: " + courseId);
        }
        if (course.getLevel() == null) {
            return new CourseAccessResponse(
                    true,
                    profile.getCurrentLevel(),
                    null,
                    "Niveau du cours inconnu : accès laissé au périmètre catalogue."
            );
        }
        boolean ok = accessPolicy.canAccessCourse(profile.getCurrentLevel(), course.getLevel());
        String msg = ok
                ? "Accès autorisé : le cours correspond à votre niveau ou en dessous."
                : "Accès refusé : ce cours est au-delà de votre niveau CECRL actuel (" + profile.getCurrentLevel() + ").";
        return new CourseAccessResponse(ok, profile.getCurrentLevel(), course.getLevel(), msg);
    }

    @Transactional(readOnly = true)
    public TeacherAdaptiveDashboardDto getTeacherDashboard() {
        long students = profileRepository.count();
        long activePaths = learningPathRepository.countByStatus(LearningPathStatus.ACTIVE);
        Double avg = progressRepository.averageCompletionPercentage();
        long openAlerts = alertRepository.countByResolvedFalse();
        long studentsWithAlerts = alertRepository.countDistinctStudentsWithOpenAlerts();
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long rec7 = recommendationRepository.countByCreatedAtAfter(weekAgo);
        long recActive = recommendationRepository.countByActiveTrue();
        List<AlertView> latestAlerts = alertRepository.findTop20ByResolvedFalseOrderByCreatedAtDesc().stream()
                .map(this::toAlertView)
                .toList();
        List<RecommendationView> latestRec = pedagogyService.listTopActiveRecommendations(12);
        return new TeacherAdaptiveDashboardDto(
                students,
                activePaths,
                avg,
                openAlerts,
                studentsWithAlerts,
                rec7,
                recActive,
                latestAlerts,
                latestRec
        );
    }

    @Transactional
    public void resolveDifficultyAlert(Long alertId) {
        LearningDifficultyAlert a = alertRepository.findById(alertId)
                .orElseThrow(() -> new NotFoundException("Alert not found: " + alertId));
        a.setResolved(true);
        alertRepository.save(a);
    }

    @Transactional
    public void resolveDifficultyAlertForStudent(Long alertId, Long studentId, Authentication authentication) {
        LearningDifficultyAlert a = alertRepository.findById(alertId)
                .orElseThrow(() -> new NotFoundException("Alert not found: " + alertId));
        if (!a.getStudentId().equals(studentId) && !adaptiveAuthorizationService.isStaff(authentication)) {
            throw new AccessDeniedException("Cette alerte ne correspond pas à votre compte.");
        }
        a.setResolved(true);
        alertRepository.save(a);
    }

    @Transactional(readOnly = true)
    public CatalogAccessOverviewDto getCatalogAccessOverview(Long studentId) {
        StudentLearningProfile profile = profileRepository.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("Student profile not found for student " + studentId));
        CourseLevel studentLevel = profile.getCurrentLevel();
        List<CatalogCourseRow> rows = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (CourseLevel cl : CourseLevel.values()) {
            List<CourseExternalDto> list;
            try {
                list = coursesClient.getAllCourses(cl.name());
            } catch (Exception e) {
                continue;
            }
            if (list == null) {
                continue;
            }
            for (CourseExternalDto c : list) {
                if (c.getId() == null || !seen.add(c.getId())) {
                    continue;
                }
                CourseLevel lvl = c.getLevel() != null ? c.getLevel() : cl;
                boolean ok = accessPolicy.canAccessCourse(studentLevel, lvl);
                String msg = ok
                        ? "Accessible — adapté à votre niveau actuel (" + studentLevel + ")."
                        : "Niveau insuffisant — ce contenu est au niveau " + lvl + " (vous : " + studentLevel + ").";
                rows.add(new CatalogCourseRow(c.getId(), c.getTitle() != null ? c.getTitle() : "Cours " + c.getId(), lvl, ok, msg));
            }
        }
        return new CatalogAccessOverviewDto(studentLevel, rows);
    }

    @Transactional(readOnly = true)
    public List<LearnerPickerEntry> listLearnersForPicker() {
        return appUserLookup.listLearnersForPicker().stream()
                .map(r -> new LearnerPickerEntry(r.id(), r.fullName(), r.email()))
                .toList();
    }

    private void applyPromotionGamification(Long studentId, CourseLevel from, CourseLevel to) {
        StudentGamification g = gamificationRepository.findByStudentId(studentId).orElseGet(() -> {
            StudentGamification created = new StudentGamification();
            created.setStudentId(studentId);
            return created;
        });
        String msg = String.format("Passage de %s à %s — continuez sur cette lancée !", from, to);
        g.setLastPromotionMessage(msg);
        g.setLastPromotionAt(Instant.now());
        String badgeToken = "Niveau " + to;
        String badges = g.getBadges() == null ? "" : g.getBadges();
        if (!badges.contains(badgeToken)) {
            g.setBadges(badges.isBlank() ? badgeToken : badges + "," + badgeToken);
        }
        g.setUpdatedAt(Instant.now());
        gamificationRepository.save(g);
    }

    private AlertView toAlertView(LearningDifficultyAlert a) {
        LearnerIdentity id = appUserLookup.findLearnerIdentity(a.getStudentId());
        return new AlertView(
                a.getId(),
                a.getStudentId(),
                a.getReason(),
                a.getSeverity(),
                a.isResolved(),
                a.getCreatedAt(),
                a.getLearningPathId(),
                id.fullName()
        );
    }

    private LearningPathItem buildItem(LearningPath path, LearningPathItemType type, Long itemId, int order, Long sourceCourseId) {
        LearningPathItem item = new LearningPathItem();
        item.setLearningPath(path);
        item.setItemType(type);
        item.setItemId(itemId);
        item.setRecommendedOrder(order);
        item.setPriorityScore(order);
        item.setStatus(LearningPathItemStatus.PENDING);
        item.setSourceCourseId(sourceCourseId);
        item.setCreatedAt(Instant.now());
        return item;
    }

    private LearningPathView toLearningPathView(LearningPath learningPath) {
        List<LearningPathItemView> items = learningPathItemRepository.findByLearningPath_IdOrderByRecommendedOrderAsc(learningPath.getId())
                .stream().map(this::toLearningPathItemView).toList();
        LearnerIdentity id = appUserLookup.findLearnerIdentity(learningPath.getStudentId());
        return new LearningPathView(
                learningPath.getId(),
                learningPath.getStudentId(),
                learningPath.getTitle(),
                learningPath.getTargetLevel(),
                learningPath.getStatus(),
                learningPath.getCreatedAt(),
                items,
                id.fullName(),
                id.email()
        );
    }

    private LearningPathItemView toLearningPathItemView(LearningPathItem item) {
        return new LearningPathItemView(
                item.getId(),
                item.getItemId(),
                item.getItemType(),
                item.getRecommendedOrder(),
                item.getStatus(),
                resolveItemTitle(item),
                resolveItemCourseLevel(item)
        );
    }

    private CourseLevel resolveItemCourseLevel(LearningPathItem item) {
        try {
            Long courseRef = item.getItemType() == LearningPathItemType.COURSE ? item.getItemId() : item.getSourceCourseId();
            if (courseRef == null) {
                return null;
            }
            CourseExternalDto c = coursesClient.getCourseById(courseRef);
            return c.getLevel();
        } catch (Exception e) {
            return null;
        }
    }

    private String resolveItemTitle(LearningPathItem item) {
        try {
            return switch (item.getItemType()) {
                case COURSE -> {
                    CourseExternalDto c = coursesClient.getCourseById(item.getItemId());
                    yield c.getTitle() != null ? c.getTitle() : "Cours #" + item.getItemId();
                }
                case RESOURCE -> {
                    Long cid = item.getSourceCourseId();
                    if (cid == null) {
                        yield "Ressource #" + item.getItemId();
                    }
                    String rt = null;
                    for (ResourceExternalDto r : coursesClient.getResourcesByCourse(cid)) {
                        if (r.getId() != null && r.getId().equals(item.getItemId())) {
                            rt = r.getTitle() != null ? r.getTitle() : "Ressource #" + item.getItemId();
                            break;
                        }
                    }
                    yield rt != null ? rt : "Ressource #" + item.getItemId();
                }
                case SESSION -> {
                    Long cid = item.getSourceCourseId();
                    if (cid == null) {
                        yield "Séance #" + item.getItemId();
                    }
                    String st = null;
                    for (SeanceExternalDto s : coursesClient.getSeancesByCourse(cid)) {
                        if (s.getId() != null && s.getId().equals(item.getItemId())) {
                            st = s.getTitle() != null ? s.getTitle() : "Séance #" + item.getItemId();
                            break;
                        }
                    }
                    yield st != null ? st : "Séance #" + item.getItemId();
                }
            };
        } catch (Exception e) {
            return item.getItemType() + " #" + item.getItemId();
        }
    }

    private void validateTransition(LearningPathItemStatus current, LearningPathItemStatus target) {
        if (current == target) {
            return;
        }
        if (current == LearningPathItemStatus.PENDING
                && (target == LearningPathItemStatus.STARTED
                || target == LearningPathItemStatus.DONE
                || target == LearningPathItemStatus.SKIPPED)) {
            return;
        }
        if (current == LearningPathItemStatus.STARTED && (target == LearningPathItemStatus.DONE || target == LearningPathItemStatus.SKIPPED)) {
            return;
        }
        throw new IllegalArgumentException("Invalid status transition: " + current + " -> " + target);
    }

    private void addPoints(Long studentId, int points) {
        StudentGamification gamification = gamificationRepository.findByStudentId(studentId).orElseGet(() -> {
            StudentGamification created = new StudentGamification();
            created.setStudentId(studentId);
            return created;
        });
        gamification.setPoints((gamification.getPoints() == null ? 0 : gamification.getPoints()) + points);
        if (gamification.getPoints() >= 100 && (gamification.getBadges() == null || !gamification.getBadges().contains("Path Finisher"))) {
            gamification.setBadges((gamification.getBadges() == null || gamification.getBadges().isBlank())
                    ? "Path Finisher"
                    : gamification.getBadges() + ",Path Finisher");
        }
        gamification.setUpdatedAt(Instant.now());
        gamificationRepository.save(gamification);
    }

    @Transactional
    public CourseEnrollmentResultView enrollInCourse(long studentId, long courseId) {
        profileRepository.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("Student profile not found. Submit placement test first."));
        CourseAccessResponse gate = checkCourseAccess(studentId, courseId);
        if (!gate.allowed()) {
            throw new AccessDeniedException(gate.message() != null ? gate.message() : "Accès au cours refusé.");
        }
        CourseExternalDto course = coursesClient.getCourseById(courseId);
        List<ChapterExternalDto> chapters = safeChapters(courseId);
        Optional<StudentCourseEnrollment> active = enrollmentRepository.findByStudentIdAndCourseIdAndStatus(
                studentId, courseId, EnrollmentStatus.ACTIVE);
        if (active.isPresent()) {
            StudentCourseEnrollment managed = enrollmentRepository.findById(active.get().getId()).orElseThrow();
            ensureProgressRows(managed, chapters);
            return new CourseEnrollmentResultView(
                    managed.getId(),
                    courseId,
                    course.getTitle() != null ? course.getTitle() : "Course",
                    managed.getStatus().name(),
                    managed.getEnrolledAt(),
                    chapters.size()
            );
        }
        StudentCourseEnrollment e = new StudentCourseEnrollment();
        e.setStudentId(studentId);
        e.setCourseId(courseId);
        e.setStatus(EnrollmentStatus.ACTIVE);
        e.setEnrolledAt(Instant.now());
        e = enrollmentRepository.save(e);
        for (ChapterExternalDto ch : chapters) {
            if (ch.getId() == null) {
                continue;
            }
            StudentChapterProgress p = new StudentChapterProgress();
            p.setEnrollment(e);
            p.setChapterId(ch.getId());
            p.setStatus(ChapterProgressStatus.NOT_STARTED);
            p.setUpdatedAt(Instant.now());
            chapterProgressRepository.save(p);
        }
        return new CourseEnrollmentResultView(
                e.getId(),
                courseId,
                course.getTitle() != null ? course.getTitle() : "Course",
                e.getStatus().name(),
                e.getEnrolledAt(),
                chapters.size()
        );
    }

    @Transactional(readOnly = true)
    public LearningPlanView getLearningPlan(long studentId, long courseId) {
        StudentCourseEnrollment en = enrollmentRepository.findByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Aucune inscription active à ce cours."));
        CourseExternalDto course = coursesClient.getCourseById(courseId);
        List<ChapterExternalDto> chapters = safeChapters(courseId);
        Map<Long, StudentChapterProgress> progByChapter = chapterProgressRepository.findByEnrollment_Id(en.getId()).stream()
                .collect(Collectors.toMap(StudentChapterProgress::getChapterId, p -> p, (a, b) -> a));
        LearnerIdentity id = appUserLookup.findLearnerIdentity(studentId);
        StudentLearningProfile prof = profileRepository.findByStudentId(studentId).orElseThrow();
        Optional<StudentPlacementTestResult> placementOpt = placementRepository.findTopByStudentIdOrderByTestDateDesc(studentId);
        Integer placementScore = placementOpt.map(StudentPlacementTestResult::getScore).orElse(null);
        String weakHint = placementOpt.map(StudentPlacementTestResult::getWeakAreas).orElse("");
        double rp = skillCompletionPercent(chapters, progByChapter, "READING");
        double wp = skillCompletionPercent(chapters, progByChapter, "WRITING");
        double lp = skillCompletionPercent(chapters, progByChapter, "LISTENING");
        double global = globalChapterCompletionPercent(chapters, progByChapter);
        List<LearningPlanSkillSectionView> sections = buildLearningPlanSections(chapters, progByChapter);
        boolean finalOk = isFinalTestEligible(studentId);
        String ai = aiRecommendationService.buildLearningPlanAssistantMessage(
                prof.getCurrentLevel(),
                course.getTitle() != null ? course.getTitle() : "cours",
                rp, wp, lp, weakHint
        );
        return new LearningPlanView(
                id.fullName(),
                id.email(),
                prof.getCurrentLevel(),
                placementScore,
                global,
                ai,
                en.getId(),
                courseId,
                course.getTitle() != null ? course.getTitle() : "Course",
                sections,
                finalOk
        );
    }

    @Transactional
    public LearningPlanChapterView updateChapterProgress(
            long studentId,
            long courseId,
            long chapterId,
            ChapterProgressStatus newStatus,
            Authentication authentication
    ) {
        StudentCourseEnrollment en = enrollmentRepository.findByStudentIdAndCourseIdAndStatus(studentId, courseId, EnrollmentStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Aucune inscription active à ce cours."));
        long caller = jwtUserResolver.requireAppUserId(authentication);
        if (!en.getStudentId().equals(caller) && !adaptiveAuthorizationService.isStaff(authentication)) {
            throw new AccessDeniedException("Cette inscription ne correspond pas à votre compte.");
        }
        StudentChapterProgress p = chapterProgressRepository.findByEnrollment_IdAndChapterId(en.getId(), chapterId)
                .orElseThrow(() -> new NotFoundException("Progression chapitre introuvable."));
        ChapterProgressStatus prev = p.getStatus();
        validateChapterTransition(prev, newStatus);
        p.setStatus(newStatus);
        if (newStatus == ChapterProgressStatus.COMPLETED) {
            p.setCompletedAt(Instant.now());
        }
        if (newStatus == ChapterProgressStatus.IN_PROGRESS) {
            p.setCompletedAt(null);
        }
        p.setUpdatedAt(Instant.now());
        chapterProgressRepository.save(p);
        if (prev != ChapterProgressStatus.COMPLETED && newStatus == ChapterProgressStatus.COMPLETED) {
            addPoints(studentId, 10);
        }
        ChapterExternalDto ch = requireChapter(courseId, chapterId);
        return toLearningPlanChapterView(ch, p);
    }

    private List<ChapterExternalDto> safeChapters(Long courseId) {
        try {
            List<ChapterExternalDto> list = coursesClient.getChaptersByCourse(courseId);
            return list != null ? list : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CourseExternalDto> safeCoursesByLevel(CourseLevel level) {
        try {
            List<CourseExternalDto> list = coursesClient.getAllCourses(level != null ? level.name() : null);
            return list != null ? list : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<ResourceExternalDto> safeResourcesByCourse(Long courseId) {
        try {
            List<ResourceExternalDto> list = coursesClient.getResourcesByCourse(courseId);
            return list != null ? list : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<SeanceExternalDto> safeSeancesByCourse(Long courseId) {
        try {
            List<SeanceExternalDto> list = coursesClient.getSeancesByCourse(courseId);
            return list != null ? list : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private void ensureProgressRows(StudentCourseEnrollment enrollment, List<ChapterExternalDto> chapters) {
        Map<Long, StudentChapterProgress> existing = chapterProgressRepository.findByEnrollment_Id(enrollment.getId()).stream()
                .collect(Collectors.toMap(StudentChapterProgress::getChapterId, x -> x, (a, b) -> a));
        for (ChapterExternalDto ch : chapters) {
            if (ch.getId() == null || existing.containsKey(ch.getId())) {
                continue;
            }
            StudentChapterProgress p = new StudentChapterProgress();
            p.setEnrollment(enrollment);
            p.setChapterId(ch.getId());
            p.setStatus(ChapterProgressStatus.NOT_STARTED);
            p.setUpdatedAt(Instant.now());
            chapterProgressRepository.save(p);
        }
    }

    private ChapterExternalDto requireChapter(Long courseId, Long chapterId) {
        for (ChapterExternalDto ch : safeChapters(courseId)) {
            if (chapterId.equals(ch.getId())) {
                return ch;
            }
        }
        throw new NotFoundException("Chapitre introuvable dans ce cours : " + chapterId);
    }

    private List<LearningPlanSkillSectionView> buildLearningPlanSections(
            List<ChapterExternalDto> chapters,
            Map<Long, StudentChapterProgress> progByChapter
    ) {
        List<String> order = List.of("READING", "WRITING", "LISTENING");
        List<LearningPlanSkillSectionView> out = new ArrayList<>();
        for (String skill : order) {
            List<LearningPlanChapterView> views = chapters.stream()
                    .filter(c -> skill.equalsIgnoreCase(String.valueOf(c.getSkillType())))
                    .sorted(Comparator.comparing(ChapterExternalDto::getOrderIndex, Comparator.nullsLast(Integer::compareTo)))
                    .map(c -> toLearningPlanChapterView(c, progByChapter.get(c.getId())))
                    .toList();
            if (!views.isEmpty()) {
                out.add(new LearningPlanSkillSectionView(skill, views));
            }
        }
        return out;
    }

    private LearningPlanChapterView toLearningPlanChapterView(ChapterExternalDto ch, StudentChapterProgress progress) {
        ChapterProgressStatus st = progress == null ? ChapterProgressStatus.NOT_STARTED : progress.getStatus();
        Instant doneAt = progress != null ? progress.getCompletedAt() : null;
        List<LearningPlanContentView> contents = new ArrayList<>();
        if (ch.getContents() != null) {
            for (ChapterContentExternalDto c : ch.getContents()) {
                contents.add(new LearningPlanContentView(
                        c.getId(),
                        c.getType(),
                        c.getTitle(),
                        c.getUrl(),
                        c.isRequired()
                ));
            }
        }
        return new LearningPlanChapterView(
                ch.getId(),
                ch.getTitle(),
                ch.getDescription(),
                ch.getSkillType() != null ? ch.getSkillType() : "",
                ch.getOrderIndex() != null ? ch.getOrderIndex() : 0,
                ch.isRequired(),
                st,
                doneAt,
                contents
        );
    }

    private double skillCompletionPercent(
            List<ChapterExternalDto> chapters,
            Map<Long, StudentChapterProgress> prog,
            String skill
    ) {
        List<ChapterExternalDto> sub = chapters.stream()
                .filter(c -> skill.equalsIgnoreCase(String.valueOf(c.getSkillType())))
                .toList();
        if (sub.isEmpty()) {
            return 100.0;
        }
        long done = sub.stream().filter(c -> {
            StudentChapterProgress p = prog.get(c.getId());
            return p != null && p.getStatus() == ChapterProgressStatus.COMPLETED;
        }).count();
        return (done * 100.0) / sub.size();
    }

    private double globalChapterCompletionPercent(List<ChapterExternalDto> chapters, Map<Long, StudentChapterProgress> prog) {
        if (chapters.isEmpty()) {
            return 0.0;
        }
        long done = chapters.stream().filter(c -> {
            StudentChapterProgress p = prog.get(c.getId());
            return p != null && p.getStatus() == ChapterProgressStatus.COMPLETED;
        }).count();
        return (done * 100.0) / chapters.size();
    }

    private void validateChapterTransition(ChapterProgressStatus from, ChapterProgressStatus to) {
        if (from == to) {
            return;
        }
        if (from == ChapterProgressStatus.NOT_STARTED
                && (to == ChapterProgressStatus.IN_PROGRESS || to == ChapterProgressStatus.COMPLETED)) {
            return;
        }
        if (from == ChapterProgressStatus.IN_PROGRESS && to == ChapterProgressStatus.COMPLETED) {
            return;
        }
        throw new IllegalArgumentException("Transition de statut chapitre invalide : " + from + " -> " + to);
    }

    private boolean isFinalTestEligible(long studentId) {
        if (chapterPathFinalTestOk(studentId)) {
            return true;
        }
        return legacyLearningPathFullyDone(studentId);
    }

    private boolean legacyLearningPathFullyDone(long studentId) {
        return progressRepository.findTopByStudentIdOrderByUpdatedAtDesc(studentId)
                .filter(p -> p.getTotalItems() != null && p.getTotalItems() > 0)
                .map(p -> p.getCompletedItems() >= p.getTotalItems())
                .orElse(false);
    }

    private boolean chapterPathFinalTestOk(long studentId) {
        StudentLearningProfile profile = profileRepository.findByStudentId(studentId).orElse(null);
        if (profile == null) {
            return false;
        }
        List<StudentCourseEnrollment> active = enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE);
        for (StudentCourseEnrollment en : active) {
            CourseExternalDto course;
            try {
                course = coursesClient.getCourseById(en.getCourseId());
            } catch (Exception e) {
                continue;
            }
            if (course.getLevel() != null && course.getLevel() != profile.getCurrentLevel()) {
                continue;
            }
            List<ChapterExternalDto> chapters = safeChapters(en.getCourseId());
            if (chapters.isEmpty()) {
                continue;
            }
            if (allRequiredChaptersCompleted(en.getId(), chapters)) {
                return true;
            }
        }
        return false;
    }

    private boolean allRequiredChaptersCompleted(Long enrollmentId, List<ChapterExternalDto> chapters) {
        Map<Long, StudentChapterProgress> prog = chapterProgressRepository.findByEnrollment_Id(enrollmentId).stream()
                .collect(Collectors.toMap(StudentChapterProgress::getChapterId, p -> p, (a, b) -> a));
        for (ChapterExternalDto ch : chapters) {
            if (!ch.isRequired()) {
                continue;
            }
            StudentChapterProgress p = prog.get(ch.getId());
            if (p == null || p.getStatus() != ChapterProgressStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }

    private CourseLevel levelFromScore(int score) {
        if (score < 20) return CourseLevel.A1;
        if (score < 40) return CourseLevel.A2;
        if (score < 60) return CourseLevel.B1;
        if (score < 80) return CourseLevel.B2;
        if (score < 90) return CourseLevel.C1;
        return CourseLevel.C2;
    }

    private CourseLevel nextLevel(CourseLevel level) {
        return switch (level) {
            case A1 -> CourseLevel.A2;
            case A2 -> CourseLevel.B1;
            case B1 -> CourseLevel.B2;
            case B2 -> CourseLevel.C1;
            case C1 -> CourseLevel.C2;
            case C2 -> CourseLevel.C2;
        };
    }

    /**
     * L’objectif CECRL doit être au moins le niveau suivant le niveau actuel (données anciennes / imports incohérents).
     */
    private void ensureMinimumTargetLevel(StudentLearningProfile profile) {
        CourseLevel minObjective = nextLevel(profile.getCurrentLevel());
        if (profile.getTargetLevel().ordinal() < minObjective.ordinal()) {
            profile.setTargetLevel(minObjective);
            profileRepository.save(profile);
        }
    }
}
