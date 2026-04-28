package com.esprit.adaptivelearning.entities;

import com.esprit.adaptivelearning.entities.enums.DifficultySeverity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "learning_difficulty_alert")
public class LearningDifficultyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 600)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DifficultySeverity severity;

    @Column(nullable = false)
    private boolean resolved = false;

    private Long learningPathId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public DifficultySeverity getSeverity() { return severity; }
    public void setSeverity(DifficultySeverity severity) { this.severity = severity; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public Long getLearningPathId() { return learningPathId; }
    public void setLearningPathId(Long learningPathId) { this.learningPathId = learningPathId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
