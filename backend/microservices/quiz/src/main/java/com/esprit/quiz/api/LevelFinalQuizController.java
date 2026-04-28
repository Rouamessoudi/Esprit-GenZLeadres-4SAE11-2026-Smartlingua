package com.esprit.quiz.api;

import com.esprit.quiz.dto.LevelFinalAttemptResultDto;
import com.esprit.quiz.dto.LevelFinalAttemptStartResponse;
import com.esprit.quiz.service.LevelFinalQuizService;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quiz/level-final")
public class LevelFinalQuizController {

    private final LevelFinalQuizService service;

    public LevelFinalQuizController(LevelFinalQuizService service) {
        this.service = service;
    }

    @PostMapping("/attempts/start")
    public LevelFinalAttemptStartResponse start(Authentication authentication) {
        return service.start(requireSubject(authentication));
    }

    @PostMapping("/attempts/{attemptId}/complete")
    public LevelFinalAttemptResultDto complete(@PathVariable long attemptId, Authentication authentication) {
        return service.completeAttempt(attemptId, requireSubject(authentication));
    }

    @GetMapping("/attempts/{attemptId}")
    public LevelFinalAttemptResultDto getResult(@PathVariable long attemptId, Authentication authentication) {
        return service.getResult(attemptId, requireSubject(authentication));
    }

    private static String requireSubject(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("JWT manquant");
        }
        return jwt.getSubject();
    }
}
