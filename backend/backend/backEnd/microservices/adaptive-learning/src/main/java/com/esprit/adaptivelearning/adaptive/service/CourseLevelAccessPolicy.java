package com.esprit.adaptivelearning.adaptive.service;

import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import org.springframework.stereotype.Component;

/**
 * Contrôle d'accès pédagogique : un étudiant ne doit pas accéder à un cours plus difficile que son niveau actuel.
 * Ordre CECRL : A1 &lt; A2 &lt; B1 &lt; B2 &lt; C1 &lt; C2.
 */
@Component
public class CourseLevelAccessPolicy {

    public boolean canAccessCourse(CourseLevel studentLevel, CourseLevel courseLevel) {
        if (studentLevel == null || courseLevel == null) {
            return false;
        }
        return courseLevel.ordinal() <= studentLevel.ordinal();
    }
}
