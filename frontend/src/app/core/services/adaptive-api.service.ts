import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { adaptiveGatewayPrefix, isNgServe } from '../api-gateway-urls';

/** Repli direct (hors ng serve) : depuis le navigateur peut échouer en CORS si le MS n’autorise pas 4200. */
const API_DIRECT = 'http://localhost:8094/api/adaptive-learning';

export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type PreferredContentType = 'ANY' | 'COURSE' | 'RESOURCE' | 'SESSION';
export type LearningPathStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type LearningPathItemType = 'COURSE' | 'RESOURCE' | 'SESSION';
export type LearningPathItemStatus = 'PENDING' | 'STARTED' | 'DONE' | 'SKIPPED';
export type DifficultySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LearningPathItemDto {
  id: number;
  courseId?: number;
  resourceId?: number;
  sessionId?: number;
  itemType: LearningPathItemType;
  recommendedOrder: number;
  priorityScore: number;
  status: LearningPathItemStatus;
}

export interface LearningPathDto {
  id: number;
  studentId: number;
  title: string;
  goal: string;
  level: CourseLevel;
  status: LearningPathStatus;
  createdAt: string;
  updatedAt: string;
  items: LearningPathItemDto[];
}

export interface RecommendationDto {
  id: number;
  studentId: number;
  courseId?: number;
  resourceId?: number;
  sessionId?: number;
  recommendationReason: string;
  confidenceScore: number;
  createdAt: string;
}

export interface StudentLearningProfileRequest {
  studentId: number;
  learningGoal: string;
  preferredContentType: PreferredContentType;
  difficultyPreference: string;
}

export interface LearningDifficultyAlertDto {
  id: number;
  studentId: number;
  courseId?: number;
  reason: string;
  severity: DifficultySeverity;
  createdAt: string;
  resolved: boolean;
}

export interface TeacherDashboardDto {
  totalLearningPaths: number;
  activeLearningPaths: number;
  unresolvedAlerts: number;
  latestAlerts: LearningDifficultyAlertDto[];
}

export interface StudentProgressAnalyticsDto {
  hasActivePath: boolean;
  learningPathId?: number;
  profileLevel?: CourseLevel;
  totalItems: number;
  doneCount: number;
  startedCount: number;
  pendingCount: number;
  skippedCount: number;
  completionPercent: number;
  estimatedMinutesRemaining: number;
  engagementInsight: string;
  openAlertsCount: number;
  pathCompleted: boolean;
}

export interface TeacherAdvancedAnalyticsDto {
  studentsWithProfile: number;
  completedPaths: number;
  archivedPaths: number;
  averageCompletionActivePathsPercent: number;
  openAlertsLow: number;
  openAlertsMedium: number;
  openAlertsHigh: number;
}

/** Réponse du coach IA pour un cours du catalogue (texte personnalisé selon le profil). */
export interface CourseCoachInsightDto {
  studentId: number;
  courseId: number;
  courseTitle: string;
  insight: string;
}

/** Conseils IA sur le parcours (niveau, progression, alertes). */
export interface LearningPathCoachDto {
  studentId: number;
  advice: string;
}

@Injectable({ providedIn: 'root' })
export class AdaptiveApiService {
  constructor(private http: HttpClient) {}

  /** Base API adaptive-learning via gateway (ou proxy en ng serve). */
  private gw(): string {
    return `${adaptiveGatewayPrefix()}/api/adaptive-learning`;
  }

  /**
   * Appelle d’abord la gateway ou le proxy Angular (même origine en dev).
   * Ne bascule vers :8094 que si ce n’est pas ng serve et que l’échec est « réseau » (status 0),
   * pas une réponse HTTP (4xx/5xx) — sinon on masquait les vraies erreurs et on provoquait un 2e échec CORS.
   */
  private via<T>(primary: Observable<T>, direct: () => Observable<T>): Observable<T> {
    return primary.pipe(
      catchError((err: HttpErrorResponse | unknown) => {
        const status = err instanceof HttpErrorResponse ? err.status : 0;
        if (typeof status === 'number' && status > 0) {
          return throwError(() => err);
        }
        if (isNgServe()) {
          return throwError(() => err);
        }
        return direct();
      })
    );
  }

  generatePath(studentId: number, regenerate = false): Observable<LearningPathDto> {
    let params = new HttpParams();
    if (regenerate) params = params.set('regenerate', 'true');
    return this.via(
      this.http.post<LearningPathDto>(`${this.gw()}/path/generate/${studentId}`, {}, { params }),
      () => this.http.post<LearningPathDto>(`${API_DIRECT}/path/generate/${studentId}`, {}, { params })
    );
  }

  getPath(studentId: number): Observable<LearningPathDto> {
    return this.via(
      this.http.get<LearningPathDto>(`${this.gw()}/path/student/${studentId}`),
      () => this.http.get<LearningPathDto>(`${API_DIRECT}/path/student/${studentId}`)
    );
  }

  getRecommendation(studentId: number): Observable<RecommendationDto> {
    return this.via(
      this.http.get<RecommendationDto>(`${this.gw()}/recommendation/student/${studentId}`),
      () => this.http.get<RecommendationDto>(`${API_DIRECT}/recommendation/student/${studentId}`)
    );
  }

  updateItemStatus(itemId: number, status: LearningPathItemStatus): Observable<LearningPathItemDto> {
    return this.via(
      this.http.put<LearningPathItemDto>(`${this.gw()}/path/item/${itemId}/status`, { status }),
      () => this.http.put<LearningPathItemDto>(`${API_DIRECT}/path/item/${itemId}/status`, { status })
    );
  }

  upsertProfile(body: StudentLearningProfileRequest): Observable<unknown> {
    return this.via(this.http.post(`${this.gw()}/profile`, body), () => this.http.post(`${API_DIRECT}/profile`, body));
  }

  getAlerts(studentId: number): Observable<LearningDifficultyAlertDto[]> {
    return this.via(
      this.http.get<LearningDifficultyAlertDto[]>(`${this.gw()}/alerts/student/${studentId}`),
      () => this.http.get<LearningDifficultyAlertDto[]>(`${API_DIRECT}/alerts/student/${studentId}`)
    );
  }

  teacherDashboard(): Observable<TeacherDashboardDto> {
    return this.via(
      this.http.get<TeacherDashboardDto>(`${this.gw()}/teacher/dashboard`),
      () => this.http.get<TeacherDashboardDto>(`${API_DIRECT}/teacher/dashboard`)
    );
  }

  getProgressAnalytics(studentId: number): Observable<StudentProgressAnalyticsDto> {
    return this.via(
      this.http.get<StudentProgressAnalyticsDto>(`${this.gw()}/students/${studentId}/progress-analytics`),
      () =>
        this.http.get<StudentProgressAnalyticsDto>(
          `${API_DIRECT}/students/${studentId}/progress-analytics`
        )
    );
  }

  getTeacherAdvancedAnalytics(): Observable<TeacherAdvancedAnalyticsDto> {
    return this.via(
      this.http.get<TeacherAdvancedAnalyticsDto>(`${this.gw()}/teacher/analytics-advanced`),
      () => this.http.get<TeacherAdvancedAnalyticsDto>(`${API_DIRECT}/teacher/analytics-advanced`)
    );
  }

  resolveAlert(alertId: number): Observable<LearningDifficultyAlertDto> {
    return this.via(
      this.http.put<LearningDifficultyAlertDto>(`${this.gw()}/alerts/${alertId}/resolve`, {}),
      () => this.http.put<LearningDifficultyAlertDto>(`${API_DIRECT}/alerts/${alertId}/resolve`, {})
    );
  }

  getCourseCoachInsight(studentId: number, courseId: number): Observable<CourseCoachInsightDto> {
    const params = new HttpParams().set('studentId', String(studentId)).set('courseId', String(courseId));
    return this.via(
      this.http.get<CourseCoachInsightDto>(`${this.gw()}/ai/course-coach`, { params }),
      () => this.http.get<CourseCoachInsightDto>(`${API_DIRECT}/ai/course-coach`, { params })
    );
  }

  getLearningPathCoach(studentId: number): Observable<LearningPathCoachDto> {
    const params = new HttpParams().set('studentId', String(studentId));
    return this.via(
      this.http.get<LearningPathCoachDto>(`${this.gw()}/path-coach`, { params }),
      () => this.http.get<LearningPathCoachDto>(`${API_DIRECT}/path-coach`, { params })
    );
  }
}
