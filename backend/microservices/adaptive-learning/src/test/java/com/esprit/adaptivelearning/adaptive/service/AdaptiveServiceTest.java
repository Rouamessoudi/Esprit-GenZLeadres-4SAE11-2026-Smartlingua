package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdaptiveServiceTest {

    @Test
    void testLevelFromScore() {
        AdaptiveLearningFacadeService service = new AdaptiveLearningFacadeService(
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null
        );

        assertEquals(CourseLevel.A1, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 10));
        assertEquals(CourseLevel.A2, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 30));
        assertEquals(CourseLevel.B1, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 50));
        assertEquals(CourseLevel.B2, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 70));
        assertEquals(CourseLevel.C1, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 85));
        assertEquals(CourseLevel.C2, ReflectionTestUtils.invokeMethod(service, "levelFromScore", 95));
    }
}
