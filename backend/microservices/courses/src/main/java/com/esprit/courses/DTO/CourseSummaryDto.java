package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.CourseLevel;

import java.time.LocalDate;

/**
 * DTO métier : résumé d'un cours avec comptages (ressources, séances).
 */
public class CourseSummaryDto {

    private Long id;
    private String title;
    private CourseLevel level;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double price;
    private long resourceCount;
    private long seanceCount;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public CourseLevel getLevel() {
        return level;
    }

    public void setLevel(CourseLevel level) {
        this.level = level;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public long getResourceCount() {
        return resourceCount;
    }

    public void setResourceCount(long resourceCount) {
        this.resourceCount = resourceCount;
    }

    public long getSeanceCount() {
        return seanceCount;
    }

    public void setSeanceCount(long seanceCount) {
        this.seanceCount = seanceCount;
    }
}
