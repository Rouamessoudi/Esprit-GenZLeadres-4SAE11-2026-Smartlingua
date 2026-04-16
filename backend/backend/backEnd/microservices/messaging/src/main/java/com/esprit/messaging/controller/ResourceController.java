package com.esprit.messaging.controller;

import com.esprit.messaging.dto.ResourceRecommendRequest;
import com.esprit.messaging.entity.Resource;
import com.esprit.messaging.service.ResourceRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    private final ResourceRecommendationService recommendationService;

    public ResourceController(ResourceRecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<?> byLevel(@PathVariable String level) {
        return ResponseEntity.ok(recommendationService.getResourcesByLevel(level));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> byUser(@PathVariable Long userId) {
        return ResponseEntity.ok(recommendationService.getUserResources(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Resource resource) {
        return ResponseEntity.ok(recommendationService.saveResource(resource));
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recommend(@RequestBody ResourceRecommendRequest request) {
        recommendationService.saveRecommendation(request.getUserId(), request.getResourceId());
        return ResponseEntity.ok(java.util.Map.of("status", "saved"));
    }
}
