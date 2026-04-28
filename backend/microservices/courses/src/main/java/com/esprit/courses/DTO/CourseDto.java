package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.CourseLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.util.List;

public class CourseDto {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(min = 2, max = 200)
    private String title;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Le niveau est obligatoire")
    private CourseLevel level;   // A1–C2

    private LocalDate startDate;
    private LocalDate endDate;

    @Min(value = 0, message = "Le prix doit être positif ou nul")
    private Double price;

    // Pour afficher aussi les resources du cours
    private List<ResourceDto> resources;

    // Pour afficher aussi les séances du cours
    private List<SeanceDto> seances;

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public CourseLevel getLevel() { return level; }
    public void setLevel(CourseLevel level) { this.level = level; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public List<ResourceDto> getResources() { return resources; }
    public void setResources(List<ResourceDto> resources) { this.resources = resources; }

    public List<SeanceDto> getSeances() { return seances; }
    public void setSeances(List<SeanceDto> seances) { this.seances = seances; }
}
