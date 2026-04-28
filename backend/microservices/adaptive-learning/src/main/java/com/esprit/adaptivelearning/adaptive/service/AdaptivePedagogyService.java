package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.adaptive.ai.PedagogicalAiRecommendationService;
import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.RecommendationView;
import com.esprit.adaptivelearning.dto.external.CourseExternalDto;
import com.esprit.adaptivelearning.dto.external.ResourceExternalDto;
import com.esprit.adaptivelearning.dto.external.SeanceExternalDto;
import com.esprit.adaptivelearning.entities.PedagogicalRecommendation;
import com.esprit.adaptivelearning.entities.StudentLearningProfile;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemType;
import com.esprit.adaptivelearning.entities.enums.RecommendationSource;
import com.esprit.adaptivelearning.feign.CoursesClient;
import com.esprit.adaptivelearning.repositories.PedagogicalRecommendationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AdaptivePedagogyService {
    private final CoursesClient coursesClient;
    private final PedagogicalRecommendationRepository recommendationRepository;
    private final PedagogicalAiRecommendationService aiService;

    public AdaptivePedagogyService(
            CoursesClient coursesClient,
            PedagogicalRecommendationRepository recommendationRepository,
            PedagogicalAiRecommendationService aiService
    ) {
        this.coursesClient = coursesClient;
        this.recommendationRepository = recommendationRepository;
        this.aiService = aiService;
    }

    @Transactional
    public List<RecommendationView> buildAndStoreRecommendationsAfterLevelKnown(Long studentId, CourseLevel level) {
        List<CourseExternalDto> courses = coursesClient.getAllCourses(level.name());
        List<RecommendationView> views = new ArrayList<>();
        int budget = 8;
        for (CourseExternalDto course : courses) {
            if (budget <= 0) {
                break;
            }
            Optional<RecommendationView> v = saveRecommendation(studentId, LearningPathItemType.COURSE, course.getId(), course.getId(),
                    course.getTitle(), ruleCourse(level, course), buildAiOrNull(level, "cours", course.getTitle()));
            v.ifPresent(views::add);
            if (v.isPresent()) {
                budget--;
            }
            for (ResourceExternalDto r : coursesClient.getResourcesByCourse(course.getId())) {
                if (budget <= 0) {
                    break;
                }
                Optional<RecommendationView> rv = saveRecommendation(studentId, LearningPathItemType.RESOURCE, r.getId(), course.getId(),
                        r.getTitle(), ruleResource(course, r), buildAiOrNull(level, "ressource", r.getTitle()));
                rv.ifPresent(views::add);
                if (rv.isPresent()) {
                    budget--;
                }
            }
            for (SeanceExternalDto s : coursesClient.getSeancesByCourse(course.getId())) {
                if (budget <= 0) {
                    break;
                }
                Optional<RecommendationView> sv = saveRecommendation(studentId, LearningPathItemType.SESSION, s.getId(), course.getId(),
                        s.getTitle(), ruleSession(course, s), buildAiOrNull(level, "séance", s.getTitle()));
                sv.ifPresent(views::add);
                if (sv.isPresent()) {
                    budget--;
                }
            }
        }
        return views;
    }

    @Transactional
    public List<RecommendationView> generateRecommendationsForStrugglingStudent(StudentLearningProfile profile) {
        return buildAndStoreRecommendationsAfterLevelKnown(profile.getStudentId(), profile.getCurrentLevel());
    }

    private Optional<RecommendationView> saveRecommendation(Long studentId, LearningPathItemType type, Long refId, Long courseCtx,
 String title, String ruleText, String aiText) {
        Instant since = Instant.now().minus(1, ChronoUnit.DAYS);
        if (recommendationRepository.existsByStudentIdAndItemTypeAndRefItemIdAndCreatedAtAfter(studentId, type, refId, since)) {
            return Optional.empty();
        }
        String text = aiText != null && !aiText.isBlank() ? aiText : ruleText;
        RecommendationSource source = aiText != null && !aiText.isBlank() ? RecommendationSource.AI : RecommendationSource.RULE;
        PedagogicalRecommendation entity = new PedagogicalRecommendation();
        entity.setStudentId(studentId);
        entity.setItemType(type);
        entity.setRefItemId(refId);
        entity.setCourseContextId(courseCtx);
        entity.setItemTitle(title != null ? title : type.name());
        entity.setPersonalizedText(text);
        entity.setSource(source);
        entity.setActive(true);
        entity.setCreatedAt(Instant.now());
        PedagogicalRecommendation saved = recommendationRepository.save(entity);
        return Optional.of(toView(saved));
    }

    private String buildAiOrNull(CourseLevel level, String kind, String name) {
        return aiService.generatePedagogicalNote(
                "Niveau étudiant " + level + ".",
                "Recommande pourquoi travailler cette " + kind + " : « " + name + " »."
        );
    }

    private static String ruleCourse(CourseLevel level, CourseExternalDto c) {
        return "Le cours « " + c.getTitle() + " » est aligné sur votre niveau " + level
                + ". Commencez par en parcourir les objectifs pour ancrer le vocabulaire.";
    }

    private static String ruleResource(CourseExternalDto course, ResourceExternalDto r) {
        return "La ressource « " + r.getTitle() + " » (cours « " + course.getTitle() + " ») renforce une compétence ciblée.";
    }

    private static String ruleSession(CourseExternalDto course, SeanceExternalDto s) {
        return "La séance « " + s.getTitle() + " » du cours « " + course.getTitle() + " » permet la mise en pratique orale/écrite.";
    }

    @Transactional(readOnly = true)
    public List<RecommendationView> listActiveForStudent(Long studentId) {
        return recommendationRepository.findByStudentIdAndActiveTrueOrderByCreatedAtDesc(studentId).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecommendationView> listTopActiveRecommendations(int limit) {
        return recommendationRepository.findTop15ByActiveTrueOrderByCreatedAtDesc().stream()
                .limit(Math.max(1, limit))
                .map(this::toView)
                .toList();
    }

    private RecommendationView toView(PedagogicalRecommendation r) {
        return new RecommendationView(
                r.getId(),
                r.getStudentId(),
                r.getItemType(),
                r.getRefItemId(),
                r.getItemTitle(),
                r.getPersonalizedText(),
                r.getSource().name(),
                r.getCreatedAt()
        );
    }

    public String buildPlacementInsight(CourseLevel assigned, int score) {
        String rule = "Votre score de placement (" + score + "/100) correspond au niveau " + assigned
                + ". Un parcours vous sera proposé à partir des contenus du catalogue pour ce niveau.";
        String ai = aiService.generatePedagogicalNote(
                "Résultat placement test langue, niveau CECRL " + assigned + ", score " + score + ".",
                "Explique brièvement ce que signifie ce niveau et comment aborder la suite."
        );
        return ai != null && !ai.isBlank() ? ai : rule;
    }
}
