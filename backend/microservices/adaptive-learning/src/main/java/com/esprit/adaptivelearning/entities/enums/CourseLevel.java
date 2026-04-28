package com.esprit.adaptivelearning.entities.enums;

/**
 * Niveaux CECRL (cadre européen commun), du plus élémentaire au plus avancé.
 * <p>
 * Ordre strict : {@code A1} (débutant) &lt; {@code A2} &lt; {@code B1} &lt; {@code B2} &lt; {@code C1} &lt; {@code C2} (maîtrise).
 * L’ordre de déclaration des constantes doit rester celui-ci pour que {@link Enum#ordinal()} reflète la progression.
 */
public enum CourseLevel {
    A1,
    A2,
    B1,
    B2,
    C1,
    C2
}
