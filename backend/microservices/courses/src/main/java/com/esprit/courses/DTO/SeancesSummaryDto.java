package com.esprit.courses.DTO;

/**
 * DTO métier : résumé des séances d'un cours (total, à venir, durée totale en minutes).
 */
public class SeancesSummaryDto {

    private long totalSeances;
    private long upcomingCount;
    private long totalDurationMinutes;

    public long getTotalSeances() {
        return totalSeances;
    }

    public void setTotalSeances(long totalSeances) {
        this.totalSeances = totalSeances;
    }

    public long getUpcomingCount() {
        return upcomingCount;
    }

    public void setUpcomingCount(long upcomingCount) {
        this.upcomingCount = upcomingCount;
    }

    public long getTotalDurationMinutes() {
        return totalDurationMinutes;
    }

    public void setTotalDurationMinutes(long totalDurationMinutes) {
        this.totalDurationMinutes = totalDurationMinutes;
    }
}
