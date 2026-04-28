package com.esprit.courses.controllers;

import com.esprit.courses.DTO.CourseSummaryDto;
import com.esprit.courses.DTO.ResourcesSummaryDto;
import com.esprit.courses.DTO.SeanceWithCourseDto;
import com.esprit.courses.DTO.SeancesSummaryDto;
import com.esprit.courses.DTO.StatisticsDto;
import com.esprit.courses.DTO.CourseCompletionDto;
import com.esprit.courses.services.IStatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API métier avancées : statistiques, résumés, prochaines séances.
 * Réponses toujours cohérentes (ex. statistiques à 0 si aucune donnée).
 */
@RestController
@RequestMapping("/api/metier")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class MetierController {

    private final IStatisticsService statisticsService;

    public MetierController(IStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * GET /api/metier/statistics
     * Statistiques globales (cours, ressources, séances, par niveau). Toujours 200.
     */
    @GetMapping("/statistics")
    public StatisticsDto getStatistics() {
        return statisticsService.getStatistics();
    }

    /**
     * GET /api/metier/courses/{id}/summary
     * Résumé d'un cours avec nombre de ressources et séances.
     */
    @GetMapping("/courses/{id}/summary")
    public CourseSummaryDto getCourseSummary(@PathVariable Long id) {
        return statisticsService.getCourseSummary(id);
    }

    /**
     * GET /api/metier/seances/upcoming?limit=10
     * Prochaines séances à venir (ordre chronologique).
     */
    @GetMapping("/seances/upcoming")
    public List<SeanceWithCourseDto> getUpcomingSeances(
            @RequestParam(defaultValue = "10") int limit) {
        return statisticsService.getUpcomingSeances(limit);
    }

    /**
     * GET /api/metier/courses/incomplete
     * Cours sans ressources ou sans séances (à compléter).
     */
    @GetMapping("/courses/incomplete")
    public List<CourseSummaryDto> getIncompleteCourses() {
        return statisticsService.getIncompleteCourses();
    }

    /**
     * GET /api/metier/courses/{id}/resources/summary
     * Résumé métier des ressources du cours (total + par type PDF, VIDEO, AUDIO).
     */
    @GetMapping("/courses/{id}/resources/summary")
    public ResourcesSummaryDto getResourcesSummary(@PathVariable Long id) {
        return statisticsService.getResourcesSummary(id);
    }

    /**
     * GET /api/metier/courses/{id}/seances/summary
     * Résumé métier des séances du cours (total, à venir, durée totale).
     */
    @GetMapping("/courses/{id}/seances/summary")
    public SeancesSummaryDto getSeancesSummary(@PathVariable Long id) {
        return statisticsService.getSeancesSummary(id);
    }

    /**
     * GET /api/metier/courses/{id}/next-seance
     * Prochaine séance à venir pour ce cours (métier avancé). 404 si aucune.
     */
    @GetMapping("/courses/{id}/next-seance")
    public ResponseEntity<SeanceWithCourseDto> getNextSeanceForCourse(@PathVariable Long id) {
        return statisticsService.getNextSeanceForCourse(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/metier/courses/{id}/completion-status
     * Statut de complétion du cours : complet = au moins 1 ressource et 1 séance (métier avancé).
     */
    @GetMapping("/courses/{id}/completion-status")
    public CourseCompletionDto getCourseCompletionStatus(@PathVariable Long id) {
        return statisticsService.getCourseCompletionStatus(id);
    }
}
