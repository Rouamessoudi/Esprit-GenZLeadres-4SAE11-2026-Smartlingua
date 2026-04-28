package com.esprit.aiassistant.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Gestion globale des exceptions dans toute l'application
 * Permet de retourner des réponses JSON homogènes :
 * { "message": "..." }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Gère les erreurs de type IllegalArgumentException (ex: paramètres incorrects)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {

        // Retourne un status 400 + message d'erreur
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    // Gère les erreurs de validation (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException ex) {

        // Récupère le premier message d'erreur de validation
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Invalid request")
                .orElse("Invalid request");

        // Retourne un status 400 + message
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", msg));
    }

    // Gère les erreurs de sécurité (ex: accès non autorisé)
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> unauthorized(SecurityException ex) {

        // Retourne un status 401 + message
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }
}