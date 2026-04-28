import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { timeout } from 'rxjs';
import {
  AdaptiveModuleService,
  CatalogAccessOverview,
  PlacementResponse,
  ProfileView,
  RecommendationView
} from '../../core/services/adaptive-module.service';
import { UserSyncService } from '../../core/user-sync.service';
import { coherentObjectiveLevel } from '../../core/cefr-levels';
import type { CourseLevel } from '../../core/services/adaptive-module.service';
import { readApiErrorMessage } from '../../core/http-error.util';

@Component({
  selector: 'app-current-level-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './current-level-page.component.html',
  styleUrl: './current-level-page.component.scss'
})
export class CurrentLevelPageComponent implements OnInit {
  placement: PlacementResponse | null = null;
  recommendations: RecommendationView[] = [];
  catalog: CatalogAccessOverview | null = null;
  profilePreview: ProfileView | null = null;
  message = '';
  error = '';
  busy = false;
  loadingProfile = false;

  displayName = '';
  displayEmail = '';

  constructor(
    public keycloak: KeycloakService,
    private adaptive: AdaptiveModuleService,
    private userSync: UserSyncService
  ) {}

  get initials(): string {
    const n = this.displayName || '?';
    const p = n.split(/\s+/).filter(Boolean);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }

  get accessibleCourses() {
    return this.catalog?.courses.filter((c) => c.accessible) ?? [];
  }

  get blockedCourses() {
    return this.catalog?.courses.filter((c) => !c.accessible) ?? [];
  }

  /** Au minimum le niveau CECRL suivant (ex. A2 → B1), jamais un niveau inférieur à l’actuel. */
  get displayObjectiveLevel(): CourseLevel | null {
    const p = this.profilePreview;
    if (!p) {
      return null;
    }
    return coherentObjectiveLevel(p.currentLevel, p.targetLevel);
  }

  get hasRecordedLevel(): boolean {
    const p = this.profilePreview;
    // Un niveau par défaut (ex: A1 bootstrap) ne doit pas masquer le test de placement.
    // Seul un vrai résultat de placement enregistré (ou un résultat fraîchement reçu) compte.
    return (p?.hasPlacementResult === true) || this.placement != null;
  }

  get showPlacementTestBlock(): boolean {
    return !this.hasRecordedLevel;
  }

  get canGeneratePath(): boolean {
    return this.placement != null || this.hasRecordedLevel;
  }

  async ngOnInit(): Promise<void> {
    this.displayName = this.userSync.getStoredStudentDisplayName();
    this.displayEmail = this.userSync.getStoredStudentEmail();
    if (this.keycloak.isLoggedIn()) {
      await this.userSync.syncCurrentUser();
      this.displayName = this.userSync.getStoredStudentDisplayName();
      this.displayEmail = this.userSync.getStoredStudentEmail();
      void this.refreshProfilePreview();
      void this.loadCatalog();
    }
  }

  refreshProfilePreview(): void {
    if (!this.keycloak.isLoggedIn()) return;
    this.loadingProfile = true;
    this.adaptive.getProfileMe().subscribe({
      next: (p) => {
        this.profilePreview = p;
        if (p.hasPlacementResult) {
          this.placement = null;
          this.recommendations = [];
        }
        this.displayName = p.learnerFullName || this.displayName;
        this.displayEmail = p.learnerEmail || this.displayEmail;
        this.loadingProfile = false;
      },
      error: (e) => {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.profilePreview = null;
        }
        this.loadingProfile = false;
      }
    });
  }

  loadCatalog(): void {
    this.adaptive.getCatalogAccessMe().subscribe({
      next: (c) => (this.catalog = c),
      error: () => { /* optionnel si pas encore de profil */ }
    });
  }

  startPlacementTest(): void {
    if (!this.keycloak.isLoggedIn()) {
      this.error = 'Connexion requise pour refaire le test.';
      return;
    }
    this.error = '';
    this.message = 'Lancement du test de placement...';
    this.busy = true;
    this.runPlacementAttempt(false);
  }

  private runPlacementAttempt(hasRetriedAfterSync: boolean): void {
    this.adaptive.startPlacementMe().pipe(timeout(20000)).subscribe({
      next: (res) => {
        this.placement = res;
        this.recommendations = res.recommendations ?? [];
        this.message = 'Test de placement terminé et niveau mis à jour automatiquement.';
        this.busy = false;
        void this.refreshProfilePreview();
        void this.loadCatalog();
      },
      error: async (e) => {
        if (!hasRetriedAfterSync) {
          await this.userSync.syncCurrentUser();
          this.runPlacementAttempt(true);
          return;
        }
        // Backend legacy: route /me absente, on retombe sur /placement-test/submit avec studentId.
        if (e instanceof HttpErrorResponse && e.status === 404 && this.profilePreview?.studentId != null) {
          this.adaptive.submitPlacementForStudent(this.profilePreview.studentId).pipe(timeout(20000)).subscribe({
            next: (res) => {
              this.placement = res;
              this.recommendations = res.recommendations ?? [];
              this.message = 'Test de placement terminé et niveau mis à jour automatiquement.';
              this.busy = false;
              void this.refreshProfilePreview();
              void this.loadCatalog();
            },
            error: (legacyErr) => {
              this.error = readApiErrorMessage(
                legacyErr,
                'Échec du test de placement : vérifiez la gateway, le microservice adaptive-learning et votre session.'
              );
              this.message = '';
              this.busy = false;
            }
          });
          return;
        }

        this.error = readApiErrorMessage(
          e,
          'Échec du test de placement : vérifiez la gateway, le microservice adaptive-learning et votre session.'
        );
        this.message = '';
        this.busy = false;
      }
    });
  }

  generatePath(): void {
    if (!this.keycloak.isLoggedIn()) {
      this.error = 'Connexion requise pour générer le parcours.';
      return;
    }
    this.error = '';
    this.message = 'Génération du parcours en cours...';
    this.busy = true;
    this.adaptive.generatePathMe().pipe(timeout(20000)).subscribe({
      next: () => {
        this.message = 'Parcours généré.';
        this.busy = false;
      },
      error: (e) => {
        this.error = readApiErrorMessage(
          e,
          'Échec de génération du parcours : vérifiez la gateway, le microservice adaptive-learning et votre session.'
        );
        this.message = '';
        this.busy = false;
      }
    });
  }
}
