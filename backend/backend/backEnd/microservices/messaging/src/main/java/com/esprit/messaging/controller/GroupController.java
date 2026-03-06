package com.esprit.messaging.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Stub pour la création de groupes. Retourne 501 en attendant l’implémentation.
 */
@RestController
@RequestMapping("/messaging/groups")
public class GroupController {

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> body) {
        return ResponseEntity
            .status(HttpStatus.NOT_IMPLEMENTED)
            .body(Map.of(
                "message", "Création de groupes bientôt disponible.",
                "status", 501
            ));
    }
}
