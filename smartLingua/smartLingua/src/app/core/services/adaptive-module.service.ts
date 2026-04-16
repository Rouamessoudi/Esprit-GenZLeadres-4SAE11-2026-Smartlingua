import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { adaptiveGatewayPrefix } from '../api-gateway-urls';

/** CECRL : A1 débutant → … → C2 le plus avancé (ordre croissant). */
export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningPathItemType = 'COURSE' | 'RESOURCE' | 'SESSION';
export type LearningPathItemStatus = 'PENDING' | 'STARTED' | 'DONE' | 'SKIPPED';
export type DifficultySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RecommendationView {
  id: number;
  studentId: number;
  itemType: LearningPathItemType;
  refItemId: number;
  itemTitle: string;
  personalizedText: string;
  source: string;
  createdAt: string;
}

export interface AlertView {
  id: number;
  studentId: number;
  reason: string;
  severity: DifficultySeverity;
  resolved: boolean;
  createdAt: string;
  learningPathId: number | null;
  learnerFullName?: string;
}

export interface PlacementResponse {
  studentId: number;
  score: number;
  assignedLevel: CourseLevel;
  pedagogicalInsight: string;
  recommendations: RecommendationView[];
  weakAreas: string | null;
  learnerFullName: string;
  learnerEmail: string;
  assistantIaMessage: string;
}

export interface LearningPathItemView {
  id: number;
  itemId: number;
  itemType: LearningPathItemType;
  recommendedOrder: number;
  status: LearningPathItemStatus;
  itemTitle: string;
  courseLevel: CourseLevel | null;
}

export interface LearningPathView {
  id: number;
  studentId: number;
  title: string;
  targetLevel: CourseLevel;
  status: string;
  createdAt: string;
  items: LearningPathItemView[];
  learnerFullName: string;
  learnerEmail: string;
}

export interface ProgressView {
  studentId: number;
  learningPathId: number;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  currentLevel: CourseLevel;
  points: number;
  badges: string;
  openAlertsCount: number;
  lastPromotionMessage: string | null;
  lastPromotionAt: string | null;
  learnerFullName: string;
  learnerEmail: string;
  aiProgressSummary: string;
}

export interface LevelTestResponse {
  studentId: number;
  score: number;
  passed: boolean;
  unlockedLevel: CourseLevel;
  promotionMessage: string | null;
  newLearningPath: LearningPathView | null;
  currentLevelAtTest: CourseLevel;
  learnerFullName: string;
  learnerEmail: string;
  aiPostTestFeedback: string;
}

export interface ProfileView {
  studentId: number;
  currentLevel: CourseLevel;
  hasPlacementResult: boolean;
  targetLevel: CourseLevel;
  preferredContentType: string;
  preferredDifficulty: string;
  points: number;
  badges: string;
  lastPromotionMessage: string | null;
  lastPromotionAt: string | null;
  progress: ProgressView | null;
  recommendations: RecommendationView[];
  openAlerts: AlertView[];
  learnerFullName: string;
  learnerEmail: string;
  aiProgressSummary: string;
}

export interface CatalogCourseRow {
  courseId: number;
  title: string;
  courseLevel: CourseLevel;
  accessible: boolean;
  accessMessage: string;
}

export interface CatalogAccessOverview {
  studentLevel: CourseLevel;
  courses: CatalogCourseRow[];
}

export type ChapterProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LearningPlanContentView {
  id: number;
  type: string;
  title: string;
  url: string;
  required: boolean;
}

export interface LearningPlanChapterView {
  chapterId: number;
  title: string;
  description: string;
  skillType: string;
  orderIndex: number;
  chapterRequired: boolean;
  progressStatus: ChapterProgressStatus;
  completedAt: string | null;
  contents: LearningPlanContentView[];
}

export interface LearningPlanSkillSectionView {
  skillType: string;
  chapters: LearningPlanChapterView[];
}

export interface LearningPlanView {
  learnerFullName: string;
  learnerEmail: string;
  currentCefrLevel: CourseLevel;
  placementScore: number | null;
  globalCompletionPercent: number;
  assistantIaMessage: string;
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  sections: LearningPlanSkillSectionView[];
  finalTestEligible: boolean;
}

export interface CourseEnrollmentResultView {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  status: string;
  enrolledAt: string;
  chaptersInitialized: number;
}

export interface LearnerPickerEntry {
  id: number;
  fullName: string;
  email: string;
}

export interface TeacherAdaptiveDashboardDto {
  studentsWithProfile: number;
  activeLearningPaths: number;
  averageCompletionPercent: number | null;
  openAlerts: number;
  studentsWithOpenAlerts: number;
  recommendationsLast7Days: number;
  recommendationsTotalActive: number;
  latestOpenAlerts: AlertView[];
  latestRecommendations: RecommendationView[];
}

@Injectable({ providedIn: 'root' })
export class AdaptiveModuleService {
  constructor(private http: HttpClient) {}

  private base(): string {
    return `${adaptiveGatewayPrefix()}/api/adaptive`;
  }

  private me(): string {
    return `${this.base()}/me`;
  }

  /** Flux connecté : score et niveau calculés côté serveur. */
  startPlacementMe(): Observable<PlacementResponse> {
    const prefix = adaptiveGatewayPrefix();
    const primary = `${this.me()}/placement-test/start`;
    const candidates = [
      primary,
      `${prefix}/adaptive/me/placement-test/start`
    ];

    const tryAt = (index: number, lastError?: unknown): Observable<PlacementResponse> => {
      if (index >= candidates.length) {
        return throwError(() => lastError ?? new Error('Aucun endpoint placement disponible.'));
      }
      return this.http.post<PlacementResponse>(candidates[index], {}).pipe(
        catchError((err: unknown) => {
          // On ne bascule vers l'endpoint suivant que pour une absence de route.
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return tryAt(index + 1, err);
          }
          return throwError(() => err);
        })
      );
    };

    return tryAt(0);
  }

  /**
   * Compatibilité backend: certaines versions n'exposent pas /me/placement-test/start
   * mais gardent l'endpoint historique /placement-test/submit.
   */
  submitPlacementForStudent(studentId: number): Observable<PlacementResponse> {
    const simulatedScore = Math.floor(Math.random() * 101);
    return this.http.post<PlacementResponse>(`${this.base()}/placement-test/submit`, {
      studentId,
      score: simulatedScore,
      weakAreas: null
    });
  }

  generatePathMe(): Observable<LearningPathView> {
    return this.http.post<LearningPathView>(`${this.me()}/learning-path/generate`, {});
  }

  getLearningPathMe(): Observable<LearningPathView> {
    return this.http.get<LearningPathView>(`${this.me()}/learning-path`);
  }

  updateItemStatus(itemId: number, status: LearningPathItemStatus): Observable<LearningPathItemView> {
    return this.http.put<LearningPathItemView>(`${this.base()}/learning-path/item/${itemId}/status`, { status });
  }

  getProgressMe(): Observable<ProgressView> {
    return this.http.get<ProgressView>(`${this.me()}/progress`);
  }

  /**
   * Enregistre le test final : le score est relu côté serveur depuis le module Quiz (corps = référence tentative uniquement).
   */
  submitLevelTestFromQuizMe(quizAttemptId: number, weakAreas = ''): Observable<LevelTestResponse> {
    return this.http.post<LevelTestResponse>(`${this.me()}/level-test/submit`, {
      quizAttemptId,
      weakAreas: weakAreas || undefined
    });
  }

  getProfileMe(): Observable<ProfileView> {
    return this.http.get<ProfileView>(`${this.me()}/profile`);
  }

  getCatalogAccessMe(): Observable<CatalogAccessOverview> {
    return this.http.get<CatalogAccessOverview>(`${this.me()}/catalog-access`);
  }

  enrollInCourseMe(courseId: number): Observable<CourseEnrollmentResultView> {
    return this.http.post<CourseEnrollmentResultView>(`${this.me()}/courses/${courseId}/enroll`, {});
  }

  getLearningPlanMe(courseId: number): Observable<LearningPlanView> {
    return this.http.get<LearningPlanView>(`${this.me()}/courses/${courseId}/learning-plan`);
  }

  updateChapterStatusMe(
    courseId: number,
    chapterId: number,
    status: ChapterProgressStatus
  ): Observable<LearningPlanChapterView> {
    return this.http.put<LearningPlanChapterView>(
      `${this.me()}/courses/${courseId}/chapters/${chapterId}/status`,
      { status }
    );
  }

  /** Vue enseignant : catalogue pour un apprenant sélectionné (JWT staff). */
  getCatalogAccessForStudent(studentId: number): Observable<CatalogAccessOverview> {
    return this.http.get<CatalogAccessOverview>(`${this.base()}/catalog-access/${studentId}`);
  }

  getLearningPathForStudent(studentId: number): Observable<LearningPathView> {
    return this.http.get<LearningPathView>(`${this.base()}/learning-path/${studentId}`);
  }

  getProgressForStudent(studentId: number): Observable<ProgressView> {
    return this.http.get<ProgressView>(`${this.base()}/progress/${studentId}`);
  }

  getProfileForStudent(studentId: number): Observable<ProfileView> {
    return this.http.get<ProfileView>(`${this.base()}/profile/${studentId}`);
  }

  teacherDashboard(): Observable<TeacherAdaptiveDashboardDto> {
    return this.http.get<TeacherAdaptiveDashboardDto>(`${this.base()}/teacher/dashboard`);
  }

  teacherLearners(): Observable<LearnerPickerEntry[]> {
    return this.http.get<LearnerPickerEntry[]>(`${this.base()}/teacher/learners`);
  }

  resolveTeacherAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.base()}/teacher/alerts/${alertId}/resolve`, {});
  }

  resolveMyAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.me()}/alerts/${alertId}/resolve`, {});
  }
}
