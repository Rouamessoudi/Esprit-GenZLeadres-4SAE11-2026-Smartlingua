import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import {
  AdaptiveModuleService,
  LearningPathItemStatus,
  LearningPathView,
  LearningPlanView,
  ProfileView
} from '../../core/services/adaptive-module.service';
import { UserSyncService } from '../../core/user-sync.service';
import { readApiErrorMessage } from '../../core/http-error.util';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntil, timeout, timer } from 'rxjs';

@Component({
  selector: 'app-adaptive-learning-path',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="head">
        <div>
          <p class="eyebrow">Parcours adaptatif</p>
          <h1>Parcours d’apprentissage</h1>
          <p class="muted" *ngIf="path">Contenus issus du catalogue pour {{ path.learnerFullName || 'votre profil' }}.</p>
        </div>
        <a routerLink="/adaptive/mon-niveau" class="back">← Mon niveau</a>
      </header>

      @if (!keycloak.isLoggedIn()) {
        <p class="banner warn">Connexion requise.</p>
      }

      <div class="toolbar card" *ngIf="keycloak.isLoggedIn() && path">
        <button type="button" class="btn primary" (click)="loadPath()" [disabled]="loading || generatingPath">{{ loading ? 'Chargement…' : 'Actualiser le parcours' }}</button>
        <button type="button" class="btn ghost" (click)="generatePath()" [disabled]="loading || generatingPath">
          {{ generatingPath ? 'Génération…' : 'Régénérer mon parcours' }}
        </button>
      </div>

      <div class="card loading-hint" *ngIf="keycloak.isLoggedIn() && !path && (loading || profileLoading || generatingPath)">
        <p class="muted loading-line">
          @if (loading) {
            Chargement de votre parcours…
          } @else if (profileLoading) {
            Chargement de votre profil…
          } @else {
            Génération de votre parcours personnalisé…
          }
        </p>
      </div>

      <div class="card empty" *ngIf="keycloak.isLoggedIn() && !loading && !profileLoading && !generatingPath && !path">
        <h2>Parcours indisponible pour le moment</h2>
        <p class="muted" *ngIf="profile?.hasPlacementResult; else noPlacementYet">
          Vous avez déjà une évaluation de niveau
          <strong *ngIf="profile?.currentLevel"> (CECRL {{ profile?.currentLevel }})</strong>.
          La génération automatique n’a pas abouti : vous pouvez réessayer ci-dessous.
        </p>
        <ng-template #noPlacementYet>
          <p class="muted">
            Aucun niveau n’est encore disponible pour ce compte.
            Passez d’abord le test de placement dans <strong>Mon niveau</strong>, puis revenez générer votre parcours.
          </p>
        </ng-template>
        <div class="item-actions">
          <a class="btn ghost" routerLink="/adaptive/mon-niveau">Voir mon niveau</a>
          <button
            type="button"
            class="btn primary"
            (click)="generatePath()"
            [disabled]="generatingPath || profile?.hasPlacementResult !== true"
          >
            {{ generatingPath ? 'Génération…' : 'Générer mon parcours' }}
          </button>
        </div>
      </div>

      @if (enrollCourseTitle) {
        <div class="card enroll-explain">
          <p class="enroll-title">
            <span class="material-icons-round" aria-hidden="true">school</span>
            Cours choisi depuis le catalogue : <strong>{{ enrollCourseTitle }}</strong>
            @if (enrollCourseCefr) { <span class="cefr-tag">CECRL {{ enrollCourseCefr }}</span> }
          </p>
          <p class="enroll-body">
            Vous pouvez suivre des cours <strong>à votre niveau ou à un niveau inférieur</strong> (ex. B1 → A1 autorisé).
            Cette page affiche votre <strong>parcours adaptatif</strong> : il est généré selon <strong>votre niveau actuel</strong>
            (après réussite au test final, le niveau actuel est promu), pas seulement selon le cours cliqué.
          </p>
          <p class="enroll-body muted">
            Pour étudier le cours sélectionné (vidéos, podcasts), ouvrez
            <a routerLink="/courses">Courses</a> et utilisez <em>Videos &amp; Podcasts</em> sur la carte du cours.
          </p>
        </div>
      }

      @if (enrollCourseId != null) {
        <div class="card course-progress" [class.course-done]="learningPlan && isCourseComplete">
          <h2 class="course-progress-title">
            <span class="material-icons-round" aria-hidden="true">timeline</span>
            Parcours du cours inscrit
          </h2>
          @if (learningPlanLoading && !learningPlan && !learningPlanError) {
            <p class="muted">Chargement de la progression (Reading / Writing / Listening)…</p>
          } @else if (learningPlanError) {
            <p class="course-progress-err">{{ learningPlanError }}</p>
          } @else if (learningPlan) {
            <div class="course-progress-head">
              <p class="course-progress-name">{{ learningPlan.courseTitle }}</p>
              @if (isCourseComplete) {
                <span class="badge-complete">
                  <span class="material-icons-round" aria-hidden="true">check_circle</span>
                  Cours complété
                </span>
              } @else {
                <span class="badge-progress">En cours</span>
              }
            </div>
            <div class="meter-wrap course-meter">
              <div class="meter-label">{{ learningPlan.globalCompletionPercent | number:'1.0-0' }} % du parcours requis complété</div>
              <div class="meter"><div class="meter-fill" [style.width.%]="learningPlan.globalCompletionPercent"></div></div>
            </div>
            @if (learningPlan.assistantIaMessage) {
              <p class="course-ai muted">{{ learningPlan.assistantIaMessage }}</p>
            }
            <a [routerLink]="['/adaptive/course', enrollCourseId, 'learning-plan']" class="course-plan-link">
              Ouvrir le parcours détaillé (chapitres, quiz, test final)
              <span class="material-icons-round" aria-hidden="true">open_in_new</span>
            </a>
          }
        </div>
      }

      @if (path) {
        <div class="path-header card">
          <div>
            <h2>{{ path.title }}</h2>
            <p class="meta">
              {{ path.learnerFullName }} · {{ path.learnerEmail }}<br />
              Cible <strong>{{ path.targetLevel }}</strong> · {{ path.status }} · {{ path.items.length }} étapes
            </p>
          </div>
          <div class="meter-wrap">
            <div class="meter-label">{{ doneCount }}/{{ path.items.length }} complétées ({{ pct | number:'1.0-0' }}%)</div>
            <div class="meter"><div class="meter-fill" [style.width.%]="pct"></div></div>
          </div>
        </div>

        <div class="items">
          @for (item of path.items; track item.id) {
            <article
              class="item-card"
              [class.done]="item.status === 'DONE'"
              [class.started]="item.status === 'STARTED'"
              [class.from-enroll]="enrollCourseId != null && item.itemType === 'COURSE' && item.itemId === enrollCourseId"
            >
              <div class="item-top">
                <span class="order">#{{ item.recommendedOrder }}</span>
                <span class="type">{{ item.itemType }}</span>
                <span class="cefr" *ngIf="item.courseLevel">CECRL {{ item.courseLevel }}</span>
                <span class="status" [attr.data-s]="item.status">{{ item.status }}</span>
              </div>
              <h3>{{ item.itemTitle || ('Référence ' + item.itemType) }}</h3>
              <div class="item-actions">
                <button type="button" class="btn ghost" (click)="setStatus(item.id, 'STARTED')" [disabled]="item.status === 'DONE'">START</button>
                <button type="button" class="btn primary" (click)="setStatus(item.id, 'DONE')" [disabled]="item.status === 'DONE'">DONE</button>
              </div>
            </article>
          }
        </div>
      }

      @if (error) {
        <p class="banner err">{{ error }}</p>
      }
    </section>
  `,
  styles: [`
    .page { max-width: 960px; margin: 2rem auto; padding: 0 1rem 3rem; font-family: system-ui, sans-serif; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; color: #6366f1; margin: 0; font-weight: 600; }
    h1 { margin: .25rem 0; font-size: 1.6rem; }
    .muted { color: #64748b; margin: 0; font-size: 14px; }
    .back { align-self: center; color: #4f46e5; font-weight: 600; text-decoration: none; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 1.25rem; box-shadow: 0 8px 24px rgba(15,23,42,.06); }
    .toolbar { margin-bottom: 1rem; }
    .toolbar .btn + .btn { margin-left: .5rem; }
    .loading-hint { margin-bottom: 1rem; }
    .loading-line { margin: 0; }
    .empty { margin-bottom: 1rem; }
    .empty h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
    .btn { border-radius: 10px; padding: .5rem 1rem; font-weight: 600; cursor: pointer; border: none; }
    .btn.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
    .btn.ghost { background: #fff; border: 1px solid #cbd5e1; color: #0f172a; }
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    .path-header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem; }
    .path-header h2 { margin: 0 0 .25rem; font-size: 1.15rem; }
    .meta { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
    .meter-wrap { min-width: 200px; flex: 1; max-width: 320px; }
    .meter-label { font-size: 12px; color: #64748b; margin-bottom: .25rem; }
    .meter { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .meter-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #22c55e); border-radius: 999px; transition: width .3s ease; }
    .items { display: flex; flex-direction: column; gap: .75rem; }
    .item-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 1.15rem; box-shadow: 0 4px 14px rgba(15,23,42,.05); }
    .item-card.done { border-color: #6ee7b7; background: #f0fdf4; }
    .item-card.started:not(.done) { border-color: #93c5fd; background: #eff6ff; }
    .item-top { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; margin-bottom: .35rem; }
    .order { font-weight: 700; color: #94a3b8; font-size: 13px; }
    .type { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: .2rem .5rem; border-radius: 6px; background: #e0e7ff; color: #3730a3; }
    .cefr { font-size: 10px; font-weight: 800; padding: .2rem .45rem; border-radius: 6px; background: #fef3c7; color: #92400e; }
    .status { font-size: 11px; font-weight: 700; padding: .2rem .5rem; border-radius: 6px; background: #f1f5f9; color: #475569; }
    .item-card.done .status { background: #dcfce7; color: #166534; }
    .item-card h3 { margin: 0 0 .75rem; font-size: 1rem; }
    .item-actions { display: flex; gap: .5rem; }
    .banner.err { background: #fef2f2; color: #991b1b; padding: .75rem 1rem; border-radius: 10px; margin-top: 1rem; }
    .banner.warn { background: #fffbeb; color: #92400e; padding: .75rem 1rem; border-radius: 10px; }
    .enroll-explain { margin-bottom: 1rem; border-color: #c7d2fe; background: linear-gradient(135deg, #eef2ff 0%, #fff 100%); }
    .enroll-title { margin: 0 0 .5rem; display: flex; flex-wrap: wrap; align-items: center; gap: .35rem; font-size: 15px; color: #1e293b; }
    .enroll-title .material-icons-round { font-size: 20px; color: #4f46e5; }
    .cefr-tag { font-size: 11px; font-weight: 800; padding: .15rem .45rem; border-radius: 6px; background: #fef3c7; color: #92400e; }
    .enroll-body { margin: 0 0 .5rem; line-height: 1.55; color: #334155; font-size: 14px; }
    .enroll-body.muted { margin-bottom: 0; font-size: 13px; color: #64748b; }
    .enroll-body a { color: #4f46e5; font-weight: 600; }
    .item-card.from-enroll { border-color: #818cf8; box-shadow: 0 0 0 2px rgba(99,102,241,.25); }
    .course-progress { margin-bottom: 1rem; border-color: #bbf7d0; background: linear-gradient(135deg, #f0fdf4 0%, #fff 55%); }
    .course-progress.course-done { border-color: #86efac; background: linear-gradient(135deg, #ecfdf5 0%, #fff 60%); }
    .course-progress-title { margin: 0 0 .75rem; font-size: 1.05rem; display: flex; align-items: center; gap: .35rem; color: #14532d; }
    .course-progress-title .material-icons-round { font-size: 22px; color: #16a34a; }
    .course-progress-head { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; flex-wrap: wrap; margin-bottom: .5rem; }
    .course-progress-name { margin: 0; font-weight: 700; color: #0f172a; font-size: 1rem; flex: 1; min-width: 0; }
    .badge-complete { display: inline-flex; align-items: center; gap: .25rem; font-size: 12px; font-weight: 800; padding: .35rem .65rem; border-radius: 999px; background: #dcfce7; color: #166534; }
    .badge-complete .material-icons-round { font-size: 16px; }
    .badge-progress { font-size: 12px; font-weight: 700; padding: .35rem .65rem; border-radius: 999px; background: #e0e7ff; color: #3730a3; }
    .course-meter { margin-top: .25rem; }
    .course-ai { margin: .75rem 0 0; font-size: 13px; line-height: 1.45; }
    .course-plan-link { display: inline-flex; align-items: center; gap: .25rem; margin-top: 1rem; color: #4f46e5; font-weight: 700; text-decoration: none; }
    .course-plan-link:hover { text-decoration: underline; }
    .course-plan-link .material-icons-round { font-size: 18px; }
    .course-progress-err { margin: 0; color: #991b1b; font-size: 14px; }
  `]
})
export class AdaptiveLearningPathComponent implements OnInit {
  path: LearningPathView | null = null;
  /** Renseigné quand il n’y a pas encore de parcours (404 / vide), pour adapter le message (placement déjà fait ou non). */
  profile: ProfileView | null = null;
  profileLoading = false;
  error = '';
  loading = false;
  generatingPath = false;
  learningPlan: LearningPlanView | null = null;
  learningPlanLoading = false;
  learningPlanError = '';
  /** Provient de Courses → Enroll (query). */
  enrollCourseId: number | null = null;
  enrollCourseTitle: string | null = null;
  enrollCourseCefr: string | null = null;
  private dataReady = false;
  /** Vrai seulement quand le backend confirme l'absence de parcours (404). */
  private missingPathConfirmed = false;
  /** Garde-fou UI: évite un spinner infini si une requête ne répond jamais. */
  private profileLoadWatchdog: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public keycloak: KeycloakService,
    private adaptive: AdaptiveModuleService,
    private userSync: UserSyncService,
    private route: ActivatedRoute
  ) {}

  get isCourseComplete(): boolean {
    const p = this.learningPlan?.globalCompletionPercent;
    return p != null && p >= 100;
  }

  /** Aligné sur le backend : résultat enregistré en base pour ce compte. */
  get placementDone(): boolean {
    return this.profile?.hasPlacementResult === true;
  }

  async ngOnInit(): Promise<void> {
    this.route.queryParamMap.subscribe((q) => {
      const raw = q.get('enrollCourseId');
      const n = raw != null && raw !== '' ? Number(raw) : NaN;
      this.enrollCourseId = Number.isFinite(n) ? n : null;
      this.enrollCourseTitle = q.get('enrollCourseTitle');
      this.enrollCourseCefr = q.get('enrollCourseCefr');
      if (this.keycloak.isLoggedIn() && this.dataReady) {
        this.loadLearningPlanIfNeeded();
      }
    });
    if (this.keycloak.isLoggedIn()) {
      await this.userSync.syncCurrentUser();
      this.dataReady = true;
      this.loadProfileForEmptyState();
    }
  }

  get doneCount(): number {
    if (!this.path) return 0;
    return this.path.items.filter((i) => i.status === 'DONE').length;
  }

  get pct(): number {
    if (!this.path || !this.path.items.length) return 0;
    return (this.doneCount / this.path.items.length) * 100;
  }

  loadPath(): void {
    if (!this.keycloak.isLoggedIn()) return;
    if (this.profile?.hasPlacementResult === false) {
      this.path = null;
      this.loading = false;
      this.error = '';
      return;
    }
    this.error = '';
    this.loading = true;
    this.missingPathConfirmed = false;
    if (this.enrollCourseId != null) {
      this.learningPlanLoading = true;
      this.learningPlanError = '';
    }
    this.adaptive.getLearningPathMe().subscribe({
      next: (res) => {
        this.path = res;
        this.loading = false;
        if (res) {
          this.profile = null;
          this.profileLoading = false;
        } else {
          this.loadProfileForEmptyState();
        }
        this.loadLearningPlanIfNeeded();
      },
      error: (e) => {
        this.path = null;
        // Nouvel étudiant: 404 = pas encore de learning path (état attendu, pas une erreur UX).
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.error = '';
          this.missingPathConfirmed = true;
        } else {
          this.error = readApiErrorMessage(e, 'Aucun parcours ou erreur de chargement.');
        }
        this.loading = false;
        this.loadProfileForEmptyState();
        this.loadLearningPlanIfNeeded();
      }
    });
  }

  private loadProfileForEmptyState(): void {
    if (!this.keycloak.isLoggedIn() || this.path != null) {
      return;
    }
    this.profileLoading = true;
    if (this.profileLoadWatchdog) {
      clearTimeout(this.profileLoadWatchdog);
    }
    this.profileLoadWatchdog = setTimeout(() => {
      if (!this.profileLoading) {
        return;
      }
      this.profileLoading = false;
      if (!this.error) {
        this.error =
          "Le chargement du profil a dépassé le délai. Vérifiez la gateway (8093), adaptive-learning (8094), puis reconnectez-vous.";
      }
    }, 15000);
    this.adaptive.getProfileMe().pipe(
      timeout(12000),
      takeUntil(timer(13000))
    ).subscribe({
      next: (p) => {
        if (this.profileLoadWatchdog) {
          clearTimeout(this.profileLoadWatchdog);
          this.profileLoadWatchdog = null;
        }
        if (this.path != null) {
          return;
        }
        this.profile = p;
        this.profileLoading = false;
        // Evite la boucle infinie profile -> path(404) -> profile -> path...
        if (p?.hasPlacementResult && !this.missingPathConfirmed) {
          this.loadPath();
        }
        this.autoGeneratePathIfPlacementDone();
      },
      error: (e) => {
        if (this.profileLoadWatchdog) {
          clearTimeout(this.profileLoadWatchdog);
          this.profileLoadWatchdog = null;
        }
        if (this.path != null) {
          return;
        }
        this.profile = null;
        this.profileLoading = false;
        if (!this.error) {
          this.error = readApiErrorMessage(
            e,
            "Impossible de charger votre profil adaptive. Vérifiez la gateway (8093), adaptive-learning (8094) et reconnectez-vous."
          );
        }
      },
      complete: () => {
        // Sécurité finale: si la requête est coupée sans next/error, ne pas laisser l'UI figée.
        if (this.path == null && this.profileLoading) {
          this.profileLoading = false;
          if (!this.error) {
            this.error =
              "Le chargement du profil n'a pas abouti. Cliquez sur 'Mon niveau' puis revenez, ou reconnectez-vous.";
          }
        }
      }
    });
  }

  /** Même rendu que Roua : dès que le placement est en base et qu’il n’y a pas de parcours, on génère sans clic. */
  private autoGeneratePathIfPlacementDone(): void {
    if (!this.keycloak.isLoggedIn() || this.path != null || this.generatingPath) {
      return;
    }
    // Sécurité anti-reset: on ne régénère que si l'absence du parcours est confirmée par un 404.
    if (!this.missingPathConfirmed) {
      return;
    }
    if (this.profile?.hasPlacementResult !== true) {
      return;
    }
    this.startGeneratePath();
  }

  generatePath(): void {
    if (!this.keycloak.isLoggedIn() || this.generatingPath) {
      return;
    }
    this.startGeneratePath();
  }

  private startGeneratePath(): void {
    if (!this.keycloak.isLoggedIn() || this.generatingPath) {
      return;
    }
    this.error = '';
    this.generatingPath = true;
    this.adaptive.generatePathMe().subscribe({
      next: (res) => {
        this.path = res;
        this.generatingPath = false;
        if (res) {
          this.profile = null;
          this.profileLoading = false;
        }
        this.loadLearningPlanIfNeeded();
      },
      error: (e) => {
        const fallback =
          this.profile?.hasPlacementResult === true
            ? 'Impossible de générer le parcours pour le moment. Réessayez dans quelques instants.'
            : 'Impossible de générer le parcours. Effectuez d’abord le test de placement sur Mon niveau, puis réessayez.';
        this.error = readApiErrorMessage(e, fallback);
        this.generatingPath = false;
      }
    });
  }

  private loadLearningPlanIfNeeded(): void {
    if (!this.keycloak.isLoggedIn()) return;
    if (this.enrollCourseId == null) {
      this.learningPlan = null;
      this.learningPlanError = '';
      this.learningPlanLoading = false;
      return;
    }
    this.loadLearningPlanForCourse(this.enrollCourseId);
  }

  private loadLearningPlanForCourse(courseId: number): void {
    this.learningPlanLoading = true;
    this.learningPlanError = '';
    this.adaptive.getLearningPlanMe(courseId).subscribe({
      next: (lp) => {
        this.learningPlan = lp;
        this.learningPlanLoading = false;
      },
      error: (e) => {
        this.learningPlan = null;
        this.learningPlanError = readApiErrorMessage(
          e,
          'Impossible de charger la progression du cours (vérifiez l’inscription et le serveur adaptive-learning).'
        );
        this.learningPlanLoading = false;
      }
    });
  }

  setStatus(itemId: number, status: LearningPathItemStatus): void {
    this.error = '';
    this.adaptive.updateItemStatus(itemId, status).subscribe({
      next: () => this.loadPath(),
      error: (e) => {
        this.error = readApiErrorMessage(e, 'Impossible de mettre à jour l’étape (vérifiez la connexion et le serveur adaptive-learning).');
      }
    });
  }
}
