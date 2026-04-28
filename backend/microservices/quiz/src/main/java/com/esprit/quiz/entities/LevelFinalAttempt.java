package com.esprit.quiz.entities;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "level_final_attempt")
public class LevelFinalAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_subject", nullable = false, length = 128)
    private String keycloakSubject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LevelFinalAttemptStatus status = LevelFinalAttemptStatus.IN_PROGRESS;

    /** Score 0–100 — défini uniquement par le serveur au moment de {@code /complete}. */
    private Integer scorePercent;

    @Column(length = 500)
    private String weakAreasAuto;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKeycloakSubject() {
        return keycloakSubject;
    }

    public void setKeycloakSubject(String keycloakSubject) {
        this.keycloakSubject = keycloakSubject;
    }

    public LevelFinalAttemptStatus getStatus() {
        return status;
    }

    public void setStatus(LevelFinalAttemptStatus status) {
        this.status = status;
    }

    public Integer getScorePercent() {
        return scorePercent;
    }

    public void setScorePercent(Integer scorePercent) {
        this.scorePercent = scorePercent;
    }

    public String getWeakAreasAuto() {
        return weakAreasAuto;
    }

    public void setWeakAreasAuto(String weakAreasAuto) {
        this.weakAreasAuto = weakAreasAuto;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
