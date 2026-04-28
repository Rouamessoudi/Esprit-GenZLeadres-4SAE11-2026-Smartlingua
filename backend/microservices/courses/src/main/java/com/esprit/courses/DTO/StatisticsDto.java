package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.CourseLevel;
import com.esprit.courses.entities.enums.ResourceType;

import java.util.Map;

/**
 * DTO métier : statistiques globales (toujours renvoyé, même sans données → 0).
 */
public class StatisticsDto {

    private long totalCourses;
    private long totalResources;
    private long totalSeances;
    private Map<CourseLevel, Long> coursesByLevel;
    /** Répartition des ressources par type (PDF, VIDEO, AUDIO). */
    private Map<ResourceType, Long> resourcesByType;
    /** Durée totale (minutes) des séances à venir. */
    private long upcomingSeancesTotalMinutes;

    public StatisticsDto() {
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getTotalResources() {
        return totalResources;
    }

    public void setTotalResources(long totalResources) {
        this.totalResources = totalResources;
    }

    public long getTotalSeances() {
        return totalSeances;
    }

    public void setTotalSeances(long totalSeances) {
        this.totalSeances = totalSeances;
    }

    public Map<CourseLevel, Long> getCoursesByLevel() {
        return coursesByLevel;
    }

    public void setCoursesByLevel(Map<CourseLevel, Long> coursesByLevel) {
        this.coursesByLevel = coursesByLevel;
    }

    public Map<ResourceType, Long> getResourcesByType() {
        return resourcesByType;
    }

    public void setResourcesByType(Map<ResourceType, Long> resourcesByType) {
        this.resourcesByType = resourcesByType;
    }

    public long getUpcomingSeancesTotalMinutes() {
        return upcomingSeancesTotalMinutes;
    }

    public void setUpcomingSeancesTotalMinutes(long upcomingSeancesTotalMinutes) {
        this.upcomingSeancesTotalMinutes = upcomingSeancesTotalMinutes;
    }
}
