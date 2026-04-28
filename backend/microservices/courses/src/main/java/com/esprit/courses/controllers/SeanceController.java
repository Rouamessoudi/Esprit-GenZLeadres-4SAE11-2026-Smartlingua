package com.esprit.courses.controllers;

import com.esprit.courses.DTO.SeanceDto;
import com.esprit.courses.services.ISeanceServices;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/seances")
@CrossOrigin(origins = "${cors.allowed-origins}")
public class SeanceController {

    private final ISeanceServices seanceServices;

    public SeanceController(ISeanceServices seanceServices) {
        this.seanceServices = seanceServices;
    }

    @PostMapping
    public SeanceDto add(@PathVariable Long courseId, @Valid @RequestBody SeanceDto dto) {
        return seanceServices.addSeanceToCourse(courseId, dto);
    }

    @PutMapping("/{seanceId}")
    public SeanceDto update(@PathVariable Long seanceId, @Valid @RequestBody SeanceDto dto) {
        return seanceServices.updateSeance(seanceId, dto);
    }

    @DeleteMapping("/{seanceId}")
    public void delete(@PathVariable Long seanceId) {
        seanceServices.deleteSeance(seanceId);
    }

    @GetMapping("/{seanceId}")
    public SeanceDto getById(@PathVariable Long seanceId) {
        return seanceServices.getSeanceById(seanceId);
    }

    @GetMapping
    public List<SeanceDto> list(@PathVariable Long courseId) {
        return seanceServices.getSeancesByCourse(courseId);
    }
}
