import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { quizGatewayPrefix } from '../api-gateway-urls';

/** Réponse alignée sur le module Quiz (test final de niveau). */
export interface LevelFinalQuizStartResponse {
  attemptId: number;
}

export interface LevelFinalQuizResult {
  attemptId: number;
  completed: boolean;
  scorePercent: number;
  passed: boolean;
  keycloakSubject: string;
  weakAreasAuto: string;
}

@Injectable({ providedIn: 'root' })
export class LevelFinalQuizService {
  constructor(private http: HttpClient) {}

  private base(): string {
    return `${quizGatewayPrefix()}/api/quiz/level-final`;
  }

  /** Démarre une session de test (côté serveur uniquement). */
  startAttempt(): Observable<LevelFinalQuizStartResponse> {
    return this.http.post<LevelFinalQuizStartResponse>(`${this.base()}/attempts/start`, {});
  }

  /** Calcule et enregistre le score sur le serveur (aucune saisie utilisateur). */
  completeAttempt(attemptId: number): Observable<LevelFinalQuizResult> {
    return this.http.post<LevelFinalQuizResult>(`${this.base()}/attempts/${attemptId}/complete`, {});
  }

  getAttempt(attemptId: number): Observable<LevelFinalQuizResult> {
    return this.http.get<LevelFinalQuizResult>(`${this.base()}/attempts/${attemptId}`);
  }
}
