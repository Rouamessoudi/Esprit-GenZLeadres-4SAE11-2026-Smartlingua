package com.esprit.courses.DTO;

/**
 * DTO métier : statut de complétion d'un cours (a au moins 1 ressource et 1 séance).
 */
public class CourseCompletionDto {

    private Long courseId;
    private String courseTitle;
    private boolean hasResources;
    private boolean hasSeances;
    private boolean complete;
    private String message;

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public boolean isHasResources() {
        return hasResources;
    }

    public void setHasResources(boolean hasResources) {
        this.hasResources = hasResources;
    }

    public boolean isHasSeances() {
        return hasSeances;
    }

    public void setHasSeances(boolean hasSeances) {
        this.hasSeances = hasSeances;
    }

    public boolean isComplete() {
        return complete;
    }

    public void setComplete(boolean complete) {
        this.complete = complete;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
