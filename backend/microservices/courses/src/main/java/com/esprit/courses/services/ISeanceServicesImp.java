package com.esprit.courses.services;

import com.esprit.courses.DTO.SeanceDto;
import com.esprit.courses.Repositories.CourseRepository;
import com.esprit.courses.Repositories.SeanceRepository;
import com.esprit.courses.entities.Course;
import com.esprit.courses.entities.Seance;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ISeanceServicesImp implements ISeanceServices {

    private final CourseRepository courseRepository;
    private final SeanceRepository seanceRepository;

    public ISeanceServicesImp(CourseRepository courseRepository,
                              SeanceRepository seanceRepository) {
        this.courseRepository = courseRepository;
        this.seanceRepository = seanceRepository;
    }

    @Override
    public SeanceDto addSeanceToCourse(Long courseId, SeanceDto dto) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        Seance seance = toEntity(dto);
        seance.setCourse(course);
        Seance saved = seanceRepository.save(seance);
        return toDto(saved);
    }

    @Override
    public SeanceDto updateSeance(Long id, SeanceDto dto) {
        Seance existing = seanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seance not found"));
        existing.setTitle(dto.getTitle());
        existing.setStartDateTime(dto.getStartDateTime());
        existing.setDurationMinutes(dto.getDurationMinutes());
        existing.setDescription(dto.getDescription());
        Seance saved = seanceRepository.save(existing);
        return toDto(saved);
    }

    @Override
    public void deleteSeance(Long id) {
        seanceRepository.deleteById(id);
    }

    @Override
    public SeanceDto getSeanceById(Long id) {
        Seance seance = seanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seance not found"));
        return toDto(seance);
    }

    @Override
    public List<SeanceDto> getSeancesByCourse(Long courseId) {
        return seanceRepository.findByCourseId(courseId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Seance toEntity(SeanceDto dto) {
        Seance s = new Seance();
        s.setTitle(dto.getTitle());
        s.setStartDateTime(dto.getStartDateTime());
        s.setDurationMinutes(dto.getDurationMinutes());
        s.setDescription(dto.getDescription());
        return s;
    }

    private SeanceDto toDto(Seance s) {
        SeanceDto dto = new SeanceDto();
        dto.setId(s.getId());
        dto.setTitle(s.getTitle());
        dto.setStartDateTime(s.getStartDateTime());
        dto.setDurationMinutes(s.getDurationMinutes());
        dto.setDescription(s.getDescription());
        return dto;
    }
}
