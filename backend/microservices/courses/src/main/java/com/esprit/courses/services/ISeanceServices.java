package com.esprit.courses.services;

import com.esprit.courses.DTO.SeanceDto;

import java.util.List;

public interface ISeanceServices {

    SeanceDto addSeanceToCourse(Long courseId, SeanceDto dto);

    SeanceDto updateSeance(Long id, SeanceDto dto);

    void deleteSeance(Long id);

    SeanceDto getSeanceById(Long id);

    List<SeanceDto> getSeancesByCourse(Long courseId);
}
