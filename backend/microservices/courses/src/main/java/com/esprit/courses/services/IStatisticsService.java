package com.esprit.courses.services;

import com.esprit.courses.DTO.CourseSummaryDto;
import com.esprit.courses.DTO.ResourcesSummaryDto;
import com.esprit.courses.DTO.SeanceWithCourseDto;
import com.esprit.courses.DTO.SeancesSummaryDto;
import com.esprit.courses.DTO.StatisticsDto;
import com.esprit.courses.DTO.CourseCompletionDto;

import java.util.List;
import java.util.Optional;
/**
 * Service métier : statistiques, résumés, séances à venir.
 * Les API renvoient toujours des données cohérentes (ex. 0 si vide).
 */
public interface IStatisticsService {

    /**
     * Statistiques globales (toujours 200, jamais vide).
     */
    StatisticsDto getStatistics();

    /**
     * Résumé d'un cours avec nombre de ressources et séances.
     */
    CourseSummaryDto getCourseSummary(Long courseId);

    /**
     * Prochaines séances à venir (ordre chronologique).
     */
    List<SeanceWithCourseDto> getUpcomingSeances(int limit);

    /**
     * Cours « à compléter » : sans ressources ou sans séances (alertes métier).
     */
    List<CourseSummaryDto> getIncompleteCourses();

    /**
     * Résumé métier des ressources d'un cours (total + par type PDF, VIDEO, AUDIO).
     */
    ResourcesSummaryDto getResourcesSummary(Long courseId);

    /**
     * Résumé métier des séances d'un cours (total, nombre à venir, durée totale en minutes).
     */
    SeancesSummaryDto getSeancesSummary(Long courseId);

    /**
     * Prochaine séance à venir pour un cours (métier avancé). Vide si aucune.
     */
    Optional<SeanceWithCourseDto> getNextSeanceForCourse(Long courseId);

    /**
     * Statut de complétion du cours : complet = au moins 1 ressource et 1 séance (métier avancé).
     */
    CourseCompletionDto getCourseCompletionStatus(Long courseId);
}
