package com.esprit.messaging.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(jakarta.persistence.PersistenceException.class)
    public ResponseEntity<Map<String, String>> handlePersistence(jakarta.persistence.PersistenceException e) {
        String message = "Données invalides.";
        Throwable cause = e.getCause();
        if (cause != null && cause.getMessage() != null) {
            String c = cause.getMessage();
            if (c.contains("invitationType") || c.contains("invitation_type")) {
                message = "Type d'invitation manquant ou invalide.";
            } else if (c.contains("created_at") || c.contains("createdAt")) {
                message = "Erreur de date de création.";
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException e) {
        String message = e.getMessage() != null ? e.getMessage() : "Erreur serveur.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
    }
}
