import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { adaptiveGatewayPrefix } from '../api-gateway-urls';
import { CourseLevel } from './adaptive-api.service';

export interface PlacementTestSubmitRequest {
  studentId: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface PlacementTestResult {
  studentId: number;
  scorePercent: number;
  assignedLevel: CourseLevel;
}

export interface StudentLevelResult {
  level: CourseLevel;
}

export interface LevelTestSubmitRequest {
  studentId: number;
  testedLevel: CourseLevel;
  scorePercent: number;
  weakAreas?: string;
}

export interface LevelTestResult {
  studentId: number;
  testedLevel: CourseLevel;
  scorePercent: number;
  passed: boolean;
  unlockedLevel: CourseLevel;
}

export interface ProgressSummary {
  studentId: number;
  currentLevel: CourseLevel;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  eligibleForLevelTest: boolean;
  points: number;
  badges: string;
}

export interface AllowedCourse {
  id: number;
  title: string;
  description?: string;
  level: CourseLevel;
}

/** Faux quiz par niveau (démo) — promotion A1 → … → C2 si score ≥ 80 %. */
export interface DemoLevelPromotionRequest {
  studentId: number;
  scorePercent: number;
}

export interface DemoLevelPromotionResponse {
  studentId?: number;
  previousLevel: CourseLevel;
  scorePercent: number;
  promoted: boolean;
  newLevel: CourseLevel;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class Module2ApiService {
  constructor(private http: HttpClient) {}
  private base(): string {
    return `${adaptiveGatewayPrefix()}/api/adaptive-learning`;
  }

  submitPlacementTest(body: PlacementTestSubmitRequest): Observable<PlacementTestResult> {
    return this.http.post<PlacementTestResult>(`${this.base()}/placement-test/submit`, body);
  }

  getPlacementResult(studentId: number): Observable<PlacementTestResult> {
    return this.http.get<PlacementTestResult>(`${this.base()}/placement-test/result/${studentId}`);
  }

  getStudentLevel(studentId: number): Observable<CourseLevel> {
    return this.http.get(`${this.base()}/student-level/${studentId}`, { responseType: 'text' }) as Observable<CourseLevel>;
  }

  submitLevelTest(body: LevelTestSubmitRequest): Observable<LevelTestResult> {
    return this.http.post<LevelTestResult>(`${this.base()}/level-test/submit`, body);
  }

  getProgressSummary(studentId: number): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${this.base()}/progress/summary`, { params: { studentId } });
  }

  getAllowedCourses(studentId: number): Observable<AllowedCourse[]> {
    return this.http.get<AllowedCourse[]>(`${this.base()}/courses/allowed`, { params: { studentId } });
  }

  aiCoach(studentId: number): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.base()}/ai/coach`, { studentId });
  }

  getAiCoachAdvice(studentId: number): Observable<{ text: string }> {
    return this.http.get<{ text: string }>(`${this.base()}/ai-coach/advice/${studentId}`);
  }

  aiCoachChat(studentId: number, question: string): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.base()}/ai-coach/chat`, { studentId, question });
  }

  submitDemoLevelPromotion(body: DemoLevelPromotionRequest): Observable<DemoLevelPromotionResponse> {
    return this.http.post<DemoLevelPromotionResponse>(`${this.base()}/demo/level-promotion`, body);
  }
}
