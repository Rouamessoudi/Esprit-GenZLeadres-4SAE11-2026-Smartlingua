package com.esprit.courses.services;

import com.esprit.courses.Repositories.SeanceRepository;
import com.esprit.courses.entities.Seance;
import com.esprit.courses.entities.enums.SeanceStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SeanceSchedulerService {

    private final SeanceRepository seanceRepository;

    public SeanceSchedulerService(SeanceRepository seanceRepository) {
        this.seanceRepository = seanceRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void updateSeanceStatus() {

        List<Seance> seances = seanceRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Seance seance : seances) {

            if (seance.getStartDateTime() != null && seance.getDurationMinutes() != null) {

                LocalDateTime endDateTime =
                        seance.getStartDateTime().plusMinutes(seance.getDurationMinutes());

                if (now.isBefore(seance.getStartDateTime())) {
                    seance.setStatus(SeanceStatus.PLANNED);
                } else if (now.isAfter(seance.getStartDateTime()) && now.isBefore(endDateTime)) {
                    seance.setStatus(SeanceStatus.ONGOING);
                } else {
                    seance.setStatus(SeanceStatus.DONE);
                }
            }
        }

        seanceRepository.saveAll(seances);
    }
}