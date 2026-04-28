package com.esprit.adaptivelearning.adaptive.schedule;

import com.esprit.adaptivelearning.adaptive.service.AdaptiveDifficultyService;
import com.esprit.adaptivelearning.entities.StudentProgress;
import com.esprit.adaptivelearning.repositories.StudentProgressRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DifficultyMonitoringSchedulerTest {

    @Mock StudentProgressRepository progressRepository;
    @Mock AdaptiveDifficultyService difficultyService;

    @InjectMocks DifficultyMonitoringScheduler scheduler;

    @Test
    void runDifficultyScan_analysesEachProgressAndScansTests() {
        StudentProgress p = new StudentProgress();
        p.setStudentId(1L);
        when(progressRepository.findAll()).thenReturn(List.of(p));

        scheduler.runDifficultyScan();

        verify(difficultyService).analyzeProgressSnapshot(p);
        verify(difficultyService).scanRecentFailedTests();
    }
}
