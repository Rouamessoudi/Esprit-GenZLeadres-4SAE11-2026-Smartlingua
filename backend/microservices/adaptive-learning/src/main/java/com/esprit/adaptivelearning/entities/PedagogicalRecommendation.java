package com.esprit.adaptivelearning.entities;

import com.esprit.adaptivelearning.entities.enums.LearningPathItemType;
import com.esprit.adaptivelearning.entities.enums.RecommendationSource;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "pedagogical_recommendation")
public class PedagogicalRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LearningPathItemType itemType;

    @Column(nullable = false)
    private Long refItemId;

    private Long courseContextId;

    @Column(nullable = false, length = 120)
    private String itemTitle;

    @Column(nullable = false, length = 2000)
    private String personalizedText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RecommendationSource source;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public LearningPathItemType getItemType() { return itemType; }
    public void setItemType(LearningPathItemType itemType) { this.itemType = itemType; }
    public Long getRefItemId() { return refItemId; }
    public void setRefItemId(Long refItemId) { this.refItemId = refItemId; }
    public Long getCourseContextId() { return courseContextId; }
    public void setCourseContextId(Long courseContextId) { this.courseContextId = courseContextId; }
    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }
    public String getPersonalizedText() { return personalizedText; }
    public void setPersonalizedText(String personalizedText) { this.personalizedText = personalizedText; }
    public RecommendationSource getSource() { return source; }
    public void setSource(RecommendationSource source) { this.source = source; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
