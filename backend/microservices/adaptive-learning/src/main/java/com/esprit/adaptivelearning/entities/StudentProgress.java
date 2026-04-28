package com.esprit.adaptivelearning.entities;

import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "student_progress")
public class StudentProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long learningPathId;

    @Column(nullable = false)
    private Integer totalItems;

    /**
     * Colonne legacy présente dans certaines bases (NOT NULL sans défaut).
     * Maintenue alignée sur totalItems.
     */
    @Column(name = "total_lessons", nullable = false)
    private Integer totalLessons = 0;

    @Column(nullable = false)
    private Integer completedItems = 0;

    /**
     * Colonne legacy présente dans certaines bases (NOT NULL sans défaut).
     * Maintenue alignée sur completedItems pour compatibilité ascendante.
     */
    @Column(name = "completed_lessons", nullable = false)
    private Integer completedLessons = 0;

    @Column(nullable = false)
    private Double completionPercentage = 0.0;

    /**
     * Colonne legacy présente dans certaines bases (NOT NULL sans défaut).
     * Maintenue alignée sur completionPercentage.
     */
    @Column(name = "completion_percent", nullable = false)
    private Double completionPercent = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CourseLevel currentLevel;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getLearningPathId() { return learningPathId; }
    public void setLearningPathId(Long learningPathId) { this.learningPathId = learningPathId; }
    public Integer getTotalItems() { return totalItems; }
    public void setTotalItems(Integer totalItems) {
        int value = totalItems == null ? 0 : totalItems;
        this.totalItems = value;
        this.totalLessons = value;
    }
    public Integer getTotalLessons() { return totalLessons; }
    public void setTotalLessons(Integer totalLessons) {
        int value = totalLessons == null ? 0 : totalLessons;
        this.totalLessons = value;
        this.totalItems = value;
    }
    public Integer getCompletedItems() { return completedItems; }
    public void setCompletedItems(Integer completedItems) {
        int value = completedItems == null ? 0 : completedItems;
        this.completedItems = value;
        this.completedLessons = value;
    }
    public Integer getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(Integer completedLessons) {
        int value = completedLessons == null ? 0 : completedLessons;
        this.completedLessons = value;
        this.completedItems = value;
    }
    public Double getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(Double completionPercentage) {
        double value = completionPercentage == null ? 0.0 : completionPercentage;
        this.completionPercentage = value;
        this.completionPercent = value;
    }
    public Double getCompletionPercent() { return completionPercent; }
    public void setCompletionPercent(Double completionPercent) {
        double value = completionPercent == null ? 0.0 : completionPercent;
        this.completionPercent = value;
        this.completionPercentage = value;
    }
    public CourseLevel getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(CourseLevel currentLevel) { this.currentLevel = currentLevel; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
