package com.esprit.courses.DTO;

import com.esprit.courses.entities.enums.ResourceType;

import java.util.Map;

/**
 * DTO métier : résumé des ressources d'un cours (total + par type PDF/VIDEO/AUDIO).
 */
public class ResourcesSummaryDto {

    private long total;
    private Map<ResourceType, Long> byType;

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public Map<ResourceType, Long> getByType() {
        return byType;
    }

    public void setByType(Map<ResourceType, Long> byType) {
        this.byType = byType;
    }
}
