package com.esprit.adaptivelearning.entities;

import com.esprit.adaptivelearning.entities.enums.LearningPathItemStatus;
import com.esprit.adaptivelearning.entities.enums.LearningPathItemType;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "learning_path_item")
public class LearningPathItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_path_id")
    private LearningPath learningPath;

    @Column(nullable = false)
    private Long itemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LearningPathItemType itemType;

    @Column(nullable = false)
    private Integer recommendedOrder;

    /** Priorité d’affichage / tri (colonne requise sur certaines bases MySQL). */
    @Column(name = "priority_score", nullable = false)
    private Integer priorityScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LearningPathItemStatus status = LearningPathItemStatus.PENDING;

    /** Pour les ressources / séances : cours parent (enrichissement Feign). */
    private Long sourceCourseId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() {
        if (priorityScore == null && recommendedOrder != null) {
            priorityScore = recommendedOrder;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LearningPath getLearningPath() {
        return learningPath;
    }

    public void setLearningPath(LearningPath learningPath) {
        this.learningPath = learningPath;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public LearningPathItemType getItemType() {
        return itemType;
    }

    public void setItemType(LearningPathItemType itemType) {
        this.itemType = itemType;
    }

    public Integer getRecommendedOrder() {
        return recommendedOrder;
    }

    public void setRecommendedOrder(Integer recommendedOrder) {
        this.recommendedOrder = recommendedOrder;
    }

    public Integer getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(Integer priorityScore) {
        this.priorityScore = priorityScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public LearningPathItemStatus getStatus() {
        return status;
    }

    public void setStatus(LearningPathItemStatus status) {
        this.status = status;
    }

    public Long getSourceCourseId() {
        return sourceCourseId;
    }

    public void setSourceCourseId(Long sourceCourseId) {
        this.sourceCourseId = sourceCourseId;
    }
}
