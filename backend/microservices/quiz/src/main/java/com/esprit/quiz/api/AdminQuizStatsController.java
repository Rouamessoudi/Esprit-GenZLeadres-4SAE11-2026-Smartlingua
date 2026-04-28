package com.esprit.quiz.api;

import com.esprit.quiz.entities.LevelFinalAttemptStatus;
import com.esprit.quiz.repositories.LevelFinalAttemptRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quiz/admin/stats")
public class AdminQuizStatsController {
    private final LevelFinalAttemptRepository attemptRepository;

    public AdminQuizStatsController(LevelFinalAttemptRepository attemptRepository) {
        this.attemptRepository = attemptRepository;
    }

    @GetMapping("/attempts-count")
    public QuizAttemptsCountResponse attemptsCount() {
        return new QuizAttemptsCountResponse(attemptRepository.countByStatus(LevelFinalAttemptStatus.COMPLETED));
    }

    public record QuizAttemptsCountResponse(long quizzesTaken) {}
}
