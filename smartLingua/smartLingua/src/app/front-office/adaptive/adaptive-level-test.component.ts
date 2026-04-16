import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AdaptiveModuleService, LevelTestResponse, ProfileView } from '../../core/services/adaptive-module.service';
import { LevelFinalQuizResult, LevelFinalQuizService } from '../../core/services/level-final-quiz.service';
import { UserSyncService } from '../../core/user-sync.service';
import { readApiErrorMessage } from '../../core/http-error.util';

@Component({
  selector: 'app-adaptive-level-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './adaptive-level-test.component.html',
  styleUrl: './adaptive-level-test.component.scss'
})
export class AdaptiveLevelTestComponent implements OnInit {
  weakAreas = '';
  attemptId: number | null = null;
  quizSnapshot: LevelFinalQuizResult | null = null;
  adaptiveRecorded = false;
  result: LevelTestResponse | null = null;
  preview: ProfileView | null = null;
  error = '';
  busy = false;
  statusLine = '';

  constructor(
    public keycloak: KeycloakService,
    private adaptive: AdaptiveModuleService,
    private quiz: LevelFinalQuizService,
    private userSync: UserSyncService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.keycloak.isLoggedIn()) {
      await this.userSync.syncCurrentUser();
      this.adaptive.getProfileMe().subscribe({
        next: (p) => (this.preview = p),
        error: () => {
          /* optionnel */
        }
      });
    }
  }

  get isEligibleForFinalTest(): boolean {
    return (this.preview?.progress?.completionPercentage ?? 0) >= 100;
  }

  get completionPercent(): number {
    return this.preview?.progress?.completionPercentage ?? 0;
  }

  get actionLabel(): string {
    if (!this.busy) return 'Passer le test final';
    if (this.statusLine) return this.statusLine;
    return 'Traitement en cours...';
  }

  passFinalTest(): void {
    if (this.busy || !this.keycloak.isLoggedIn()) {
      return;
    }
    this.error = '';
    this.result = null;
    if (this.attemptId != null && this.quizSnapshot == null) {
      this.statusLine = 'Calcul du score...';
      this.busy = true;
      this.runQuizServerScoreInternal();
      return;
    }
    if (this.attemptId != null && this.quizSnapshot != null && !this.adaptiveRecorded) {
      this.statusLine = 'Enregistrement du résultat...';
      this.busy = true;
      this.recordOnAdaptivePathInternal();
      return;
    }
    this.statusLine = 'Création de la session...';
    this.startSessionInternal();
  }

  startQuizSessionOnly(): void {
    if (this.busy || !this.keycloak.isLoggedIn() || this.attemptId != null) {
      return;
    }
    this.error = '';
    this.statusLine = 'Création de la session...';
    this.busy = true;
    this.quiz.startAttempt().subscribe({
      next: (r) => {
        this.attemptId = r.attemptId;
        this.statusLine = '';
        this.busy = false;
      },
      error: (e) => {
        this.error = readApiErrorMessage(
          e,
          'Quiz injoignable : démarrez le microservice sur le port 8088, vérifiez Keycloak (JWT) et ng serve + proxy.'
        );
        this.statusLine = '';
        this.busy = false;
      }
    });
  }

  private startSessionInternal(): void {
    this.error = '';
    this.busy = true;
    this.quiz.startAttempt().subscribe({
      next: (r) => {
        this.attemptId = r.attemptId;
        this.statusLine = 'Calcul du score...';
        this.runQuizServerScoreInternal();
      },
      error: (e) => {
        this.error = readApiErrorMessage(
          e,
          'Quiz injoignable : démarrez le microservice sur le port 8088, vérifiez Keycloak (JWT) et ng serve + proxy.'
        );
        this.statusLine = '';
        this.busy = false;
      }
    });
  }

  private runQuizServerScoreInternal(): void {
    if (this.attemptId == null) {
      this.busy = false;
      this.statusLine = '';
      return;
    }
    this.error = '';
    this.quiz.completeAttempt(this.attemptId).subscribe({
      next: (q) => {
        this.quizSnapshot = q;
        this.statusLine = 'Enregistrement du résultat...';
        this.recordOnAdaptivePathInternal();
      },
      error: (e) => {
        this.error = readApiErrorMessage(e, 'Échec du calcul de score côté Quiz.');
        this.statusLine = '';
        this.busy = false;
      }
    });
  }

  private recordOnAdaptivePathInternal(): void {
    if (this.attemptId == null || this.quizSnapshot == null) {
      this.busy = false;
      this.statusLine = '';
      return;
    }
    this.error = '';
    this.result = null;
    this.adaptive.submitLevelTestFromQuizMe(this.attemptId, this.weakAreas).subscribe({
      next: (res) => {
        this.result = res;
        this.adaptiveRecorded = true;
        this.statusLine = '';
        this.busy = false;
      },
      error: (e) => {
        this.error = readApiErrorMessage(e, 'Erreur enregistrement Adaptive — détail indisponible.');
        this.statusLine = '';
        this.busy = false;
      }
    });
  }
}
