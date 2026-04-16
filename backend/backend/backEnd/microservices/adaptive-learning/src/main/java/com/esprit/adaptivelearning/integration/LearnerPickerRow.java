package com.esprit.adaptivelearning.integration;

/** Ligne pour sélection enseignant (id technique réservé au client, pas affiché comme libellé principal). */
public record LearnerPickerRow(long id, String fullName, String email) {}
