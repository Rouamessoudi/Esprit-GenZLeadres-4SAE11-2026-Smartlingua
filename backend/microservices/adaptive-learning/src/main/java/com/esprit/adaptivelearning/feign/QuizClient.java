package com.esprit.adaptivelearning.feign;

import com.esprit.adaptivelearning.dto.external.quiz.QuizLevelFinalResultDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "quiz", configuration = {QuizFeignConfig.class, FeignClientJacksonConfig.class})
public interface QuizClient {

    @GetMapping("/api/quiz/level-final/attempts/{attemptId}")
    QuizLevelFinalResultDto getLevelFinalAttempt(@PathVariable("attemptId") long attemptId);
}
