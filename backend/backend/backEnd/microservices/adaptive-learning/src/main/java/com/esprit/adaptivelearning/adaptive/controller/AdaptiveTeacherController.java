package com.esprit.adaptivelearning.adaptive.controller;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.LearnerPickerEntry;
import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos.TeacherAdaptiveDashboardDto;
import com.esprit.adaptivelearning.adaptive.service.AdaptiveLearningFacadeService;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/adaptive/teacher")
public class AdaptiveTeacherController {

    private final AdaptiveLearningFacadeService facadeService;

    public AdaptiveTeacherController(AdaptiveLearningFacadeService facadeService) {
        this.facadeService = facadeService;
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/dashboard")
    public TeacherAdaptiveDashboardDto dashboard() {
        return facadeService.getTeacherDashboard();
    }

    /** Liste pour sélection par nom (démo enseignant / admin) — l’id sert uniquement aux appels API techniques. */
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/learners")
    public List<LearnerPickerEntry> learners() {
        return facadeService.listLearnersForPicker();
    }

    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<Void> resolveAlert(@PathVariable Long alertId) {
        facadeService.resolveDifficultyAlert(alertId);
        return ResponseEntity.noContent().build();
    }
}
