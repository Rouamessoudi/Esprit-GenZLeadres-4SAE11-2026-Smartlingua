package com.esprit.adaptivelearning.entities;

import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "student_level_test_result")
public class StudentLevelTestResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CourseLevel currentLevel;

    /** Score 0–100 (nom de colonne historique côté MySQL : {@code score}). */
    @Column(nullable = false)
    private Integer score;

    /** Duplicata attendu par certaines bases ({@code score_percent} NOT NULL). */
    @Column(name = "score_percent", nullable = false)
    private Integer scorePercent;

    @Column(nullable = false)
    private Boolean passed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CourseLevel unlockedLevel;

    @Column(length = 500)
    private String weakAreas;

    /** Référence tentative Quiz (anti double enregistrement) — nullable pour anciens enregistrements. */
    @Column(name = "quiz_attempt_id", unique = true)
    private Long quizAttemptId;

    @Column(name = "test_date", nullable = false)
    private Instant testDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (testDate == null) {
            testDate = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (scorePercent == null && score != null) {
            scorePercent = score;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public CourseLevel getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(CourseLevel currentLevel) { this.currentLevel = currentLevel; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) {
        this.score = score;
        this.scorePercent = score;
    }
    public Integer getScorePercent() { return scorePercent; }
    public void setScorePercent(Integer scorePercent) { this.scorePercent = scorePercent; }
    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }
    public CourseLevel getUnlockedLevel() { return unlockedLevel; }
    public void setUnlockedLevel(CourseLevel unlockedLevel) { this.unlockedLevel = unlockedLevel; }
    public String getWeakAreas() { return weakAreas; }
    public void setWeakAreas(String weakAreas) { this.weakAreas = weakAreas; }
    public Instant getTestDate() { return testDate; }
    public void setTestDate(Instant testDate) { this.testDate = testDate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Long getQuizAttemptId() { return quizAttemptId; }
    public void setQuizAttemptId(Long quizAttemptId) { this.quizAttemptId = quizAttemptId; }
}
