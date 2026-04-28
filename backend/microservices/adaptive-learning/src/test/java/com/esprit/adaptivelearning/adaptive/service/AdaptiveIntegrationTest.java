package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.adaptive.dto.AdaptiveDtos;
import com.esprit.adaptivelearning.feign.CoursesClient;
import com.esprit.adaptivelearning.feign.QuizClient;
import com.esprit.adaptivelearning.integration.AppUserLookup;
import com.esprit.adaptivelearning.integration.LearnerIdentity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class AdaptiveIntegrationTest {

    @Autowired
    AdaptiveLearningFacadeService adaptiveService;

    @MockitoBean
    CoursesClient coursesClient;

    @MockitoBean
    QuizClient quizClient;

    @MockitoBean
    AppUserLookup appUserLookup;

    @BeforeEach
    void setUp() {
        when(appUserLookup.findLearnerIdentity(anyLong())).thenReturn(new LearnerIdentity("Test User", "test@example.com"));
    }

    @Test
    void testPlacementFlow() {
        AdaptiveDtos.PlacementTestSubmitResponse result = adaptiveService.startPlacementTest(1L);
        assertNotNull(result);
        assertNotNull(result.assignedLevel());
    }
}
