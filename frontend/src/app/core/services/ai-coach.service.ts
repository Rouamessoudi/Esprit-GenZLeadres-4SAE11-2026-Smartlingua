import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { isNgServe } from '../api-gateway-urls';

export type CoachTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CoachAdviceType =
  | 'REVISION'
  | 'SKILL_FOCUS'
  | 'STUDY_PLAN'
  | 'MOTIVATION'
  | 'DAILY'
  | 'PROGRESS';

export type CourseLevelCe = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface StudentProfileSnapshot {
  studentId: number;
  level: CoachTier;
  score: number;
  progress: number;
  lessonsCompleted: number;
  englishLevel: CourseLevelCe;
}

export interface CoachRecommendationItem {
  id: number;
  message: string;
  type: CoachAdviceType;
  createdAt: string;
}

export interface AiCoachResponse {
  studentId: number;
  generatedAt: string | null;
  dailyAdvice: string | null;
  progressImprovementSuggestion: string | null;
  profile: StudentProfileSnapshot;
  recommendations: CoachRecommendationItem[];
}

@Injectable({ providedIn: 'root' })
export class AiCoachService {
  constructor(private http: HttpClient) {}

  private base(): string {
    if (isNgServe()) {
      return 'http://localhost:8094';
    }
    return 'http://localhost:8093/adaptive-learning';
  }

  /** Génère et enregistre les recommandations (GET côté backend du cahier des charges). */
  askCoach(studentId: number): Observable<AiCoachResponse> {
    return this.http
      .get<AiCoachResponse>(`${this.base()}/api/ai-coach/${studentId}`)
      .pipe(catchError((e) => throwError(() => e)));
  }

  latestOnly(studentId: number): Observable<AiCoachResponse> {
    return this.http.get<AiCoachResponse>(`${this.base()}/api/ai-coach/${studentId}/latest`);
  }
}
