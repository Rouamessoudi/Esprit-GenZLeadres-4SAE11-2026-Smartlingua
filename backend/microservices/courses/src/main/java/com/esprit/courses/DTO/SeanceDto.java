package com.esprit.courses.DTO;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class SeanceDto {

    private Long id;

    @NotBlank(message = "Le titre de la séance est obligatoire")
    @Size(min = 1, max = 255)
    private String title;

    @NotNull(message = "La date et l'heure sont obligatoires")
    private LocalDateTime startDateTime;

    @NotNull(message = "La durée est obligatoire")
    @Min(value = 1, message = "La durée doit être d'au moins 1 minute")
    @Max(value = 480, message = "La durée ne peut pas dépasser 8 heures")
    private Integer durationMinutes;

    @Size(max = 1000)
    private String description;

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getStartDateTime() { return startDateTime; }
    public void setStartDateTime(LocalDateTime startDateTime) { this.startDateTime = startDateTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
