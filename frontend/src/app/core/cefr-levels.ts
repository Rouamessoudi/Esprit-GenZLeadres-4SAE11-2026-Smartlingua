/**
 * CECRL : A1 (débutant) → A2 → B1 → B2 → C1 → C2 (le plus avancé).
 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_ORDER: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function nextCefrLevel(level: CefrLevel): CefrLevel {
  const i = CEFR_ORDER.indexOf(level);
  if (i < 0) {
    return 'C2';
  }
  return CEFR_ORDER[Math.min(i + 1, CEFR_ORDER.length - 1)];
}

/**
 * Objectif affiché : au minimum le niveau suivant le niveau actuel (évite A2 + objectif A1 si l’API renvoie d’anciennes données).
 */
export function coherentObjectiveLevel(current: CefrLevel, apiTarget: CefrLevel): CefrLevel {
  const min = nextCefrLevel(current);
  const ti = CEFR_ORDER.indexOf(apiTarget);
  const mi = CEFR_ORDER.indexOf(min);
  if (ti < mi) {
    return min;
  }
  return apiTarget;
}

/** Indice 0..5 pour comparer les niveaux. */
export function cefrRank(level: CefrLevel): number {
  const i = CEFR_ORDER.indexOf(level);
  return i < 0 ? 0 : i;
}

/**
 * L’apprenant peut suivre un cours si le cours est au même niveau ou plus bas que le sien (CECRL).
 * Sans profil ({@code null}), on se limite au plus bas (A1) pour l’accès.
 */
export function canAccessCourseByCefr(studentLevel: CefrLevel | null, courseLevel: CefrLevel): boolean {
  const max = studentLevel ?? 'A1';
  return cefrRank(courseLevel) <= cefrRank(max);
}
