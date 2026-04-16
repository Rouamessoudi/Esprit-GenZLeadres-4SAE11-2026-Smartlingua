import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AdaptiveModuleService, AlertView, ProfileView } from '../../core/services/adaptive-module.service';
import { UserSyncService } from '../../core/user-sync.service';
import { coherentObjectiveLevel } from '../../core/cefr-levels';
import { readApiErrorMessage } from '../../core/http-error.util';

@Component({
  selector: 'app-adaptive-progression',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-head card-soft">
        <div class="page-head-main">
          <p class="eyebrow">Adaptive Learning</p>
          <h1>Progression</h1>
          <p class="muted" *ngIf="profile">{{ profile.learnerFullName }} · {{ profile.learnerEmail }}</p>
        </div>
        <a routerLink="/adaptive/mon-niveau" class="back-link">← Mon niveau</a>
      </header>

      @if (!keycloak.isLoggedIn()) {
        <p class="banner warn">Connexion requise.</p>
      }

      <div class="toolbar" *ngIf="keycloak.isLoggedIn()">
        <button type="button" class="btn btn-primary" (click)="load()" [disabled]="loading">
          {{ loading ? 'Chargement…' : 'Actualiser' }}
        </button>
      </div>

      @if (profile) {
        <div class="card assistant-card" *ngIf="profile.aiProgressSummary">
          <div class="assistant-head"><span class="spark">✨</span><h2>Résumé IA de progression</h2></div>
          <p class="assistant-text">{{ profile.aiProgressSummary }}</p>
        </div>

        <div class="stats-grid" *ngIf="profile.progress as prog">
          <div class="metric-card">
            <span class="stat-label">Complétion</span>
            <strong class="stat-val">{{ prog.completionPercentage | number:'1.0-1' }}%</strong>
            <p class="stat-sub">{{ prog.completedItems }}/{{ prog.totalItems }} étapes</p>
          </div>
          <div class="metric-card">
            <span class="stat-label">Niveau</span>
            <strong class="stat-val">{{ prog.currentLevel }}</strong>
            <p class="stat-sub">Objectif {{ displayObjective(profile) }}</p>
          </div>
          <div class="metric-card">
            <span class="stat-label">Points</span>
            <strong class="stat-val">{{ prog.points }}</strong>
            <p class="stat-sub">Gamification</p>
          </div>
          <div class="metric-card metric-alert" *ngIf="prog.openAlertsCount > 0">
            <span class="stat-label">Alertes</span>
            <strong class="stat-val">{{ prog.openAlertsCount }}</strong>
            <p class="stat-sub">Pédagogiques</p>
          </div>
        </div>

        <div class="card meter-card" *ngIf="profile.progress as prog">
          <div class="meter-head">
            <span>Vue globale</span>
            <span class="meter-pct">{{ prog.completionPercentage | number:'1.0-0' }}%</span>
          </div>
          <div class="meter-track"><div class="meter-fill" [style.width.%]="prog.completionPercentage"></div></div>
        </div>

        <div class="card promo-card" *ngIf="profile.lastPromotionMessage">
          <h2>Promotion</h2>
          <p class="promo-text">{{ profile.lastPromotionMessage }}</p>
          <p class="muted small" *ngIf="profile.lastPromotionAt">{{ formatAlertDate(profile.lastPromotionAt) }}</p>
        </div>

        <div class="card badges-card" *ngIf="profile.badges">
          <h2>Badges</h2>
          <div class="badges">
            @for (b of badgeList(profile.badges); track b) {
              <span class="badge-chip">{{ b }}</span>
            }
          </div>
        </div>

        <div class="card alerts-card">
          <h2>Alertes pédagogiques</h2>
          @if (profile.openAlerts.length) {
            <div class="alerts-list">
              @for (a of profile.openAlerts; track a.id) {
                <article class="alert-item"
                         [class.sev-high]="a.severity === 'HIGH'"
                         [class.sev-medium]="a.severity === 'MEDIUM'"
                         [class.sev-low]="a.severity === 'LOW'"
                         [class.resolved]="a.resolved">
                  <div class="alert-main">
                    <div class="alert-top">
                      <span class="severity-pill"
                            [class.severity-high]="a.severity === 'HIGH'"
                            [class.severity-medium]="a.severity === 'MEDIUM'"
                            [class.severity-low]="a.severity === 'LOW'">{{ a.severity }}</span>
                      <span class="learner-name" *ngIf="a.learnerFullName">{{ a.learnerFullName }}</span>
                    </div>
                    <p class="alert-reason">
                      <span class="reason-code" *ngIf="parseReason(a.reason).code as c">[{{ c }}]</span>
                      <span class="reason-message">
                        {{ parseReason(a.reason).message }}
                      </span>
                    </p>
                    <p class="alert-meta">
                      <span class="meta-pill" [class.meta-ok]="a.resolved">{{ a.resolved ? 'Traité' : 'Non traité' }}</span>
                      <span class="meta-dot">•</span>
                      <span>{{ formatAlertDate(a.createdAt) }}</span>
                      <span class="meta-dot">•</span>
                      <span class="recommendation">{{ recommendationForCode(parseReason(a.reason).code) }}</span>
                      <span *ngIf="a.learningPathId != null" class="meta-path">• Parcours #{{ a.learningPathId }}</span>
                    </p>
                  </div>
                  <div class="alert-actions">
                    <button type="button"
                            class="btn btn-alert"
                            *ngIf="!a.resolved"
                            (click)="markAlertResolved(a)"
                            [disabled]="resolvingAlertId === a.id">
                      {{ resolvingAlertId === a.id ? 'Traitement…' : 'Marquer comme traité' }}
                    </button>
                    <span class="resolved-chip" *ngIf="a.resolved">Traité</span>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">Aucune alerte pédagogique</div>
          }
        </div>

        <div class="card recs-card" *ngIf="profile.recommendations?.length">
          <h2>Recommandations</h2>
          <div class="recs">
            @for (r of profile.recommendations; track r.id) {
              <article class="rec">
                <div class="rec-head">
                  <span class="rec-source">{{ r.source }}</span>
                </div>
                <h3 class="rec-title">{{ r.itemTitle }}</h3>
                <p class="rec-text">{{ r.personalizedText }}</p>
              </article>
            }
          </div>
        </div>
      }

      @if (error) {
        <p class="banner err">{{ error }}</p>
      }
    </section>
  `,
  styles: [`
    .page { max-width: 1080px; margin: 2rem auto; padding: 0 1rem 3rem; font-family: Inter, system-ui, sans-serif; color: #1f2937; }
    .page-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .card-soft { background: #ffffff; border: 1px solid #ececf8; border-radius: 18px; padding: 1rem 1.25rem; box-shadow: 0 10px 28px rgba(76, 57, 145, 0.04); }
    .page-head-main { min-width: 0; }
    .eyebrow { text-transform: uppercase; letter-spacing: .09em; font-size: 11px; color: #7c6dd8; margin: 0; font-weight: 700; }
    h1 { margin: .3rem 0 .15rem; font-size: 1.8rem; line-height: 1.2; color: #1f2937; }
    h2 { margin: 0 0 .85rem; font-size: 1.12rem; color: #111827; }
    .muted { color: #6b7280; margin: 0; font-size: 14px; }
    .small { font-size: 12px; }
    .back-link { color: #6952d9; text-decoration: none; font-weight: 600; background: #f5f2ff; border: 1px solid #e6defd; border-radius: 10px; padding: .45rem .75rem; }
    .back-link:hover { background: #efe9ff; }
    .toolbar { margin-bottom: 1rem; display: flex; justify-content: flex-end; }
    .btn { border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: .2s ease; }
    .btn:disabled { opacity: .55; cursor: not-allowed; }
    .btn-primary { padding: .56rem 1rem; color: #fff; background: linear-gradient(135deg, #6b5ae6, #8d74ee); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(107, 90, 230, .26); }
    .card { background: #fff; border: 1px solid #ececf8; border-radius: 18px; padding: 1.05rem 1.25rem; box-shadow: 0 10px 30px rgba(22, 22, 49, 0.04); margin-bottom: 1rem; }
    .assistant-card { background: linear-gradient(145deg, #f8f6ff, #f9fbff); }
    .assistant-head { display: flex; align-items: center; gap: .45rem; margin-bottom: .55rem; }
    .assistant-head h2 { margin: 0; font-size: 1.05rem; }
    .spark { font-size: 1.12rem; }
    .assistant-text { margin: 0; line-height: 1.6; color: #374151; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: .8rem; margin-bottom: 1rem; }
    .metric-card { background: #fff; border: 1px solid #ececf8; border-radius: 16px; padding: .95rem 1rem; box-shadow: 0 6px 20px rgba(30, 27, 75, .04); }
    .metric-alert { background: #fff7ed; border-color: #ffe3c2; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #8b95a7; font-weight: 800; letter-spacing: .04em; }
    .stat-val { display: block; font-size: 1.52rem; margin: .2rem 0; color: #1f2937; }
    .stat-sub { margin: 0; font-size: 13px; color: #667085; }
    .meter-card { background: #fff; }
    .meter-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .55rem; font-weight: 700; color: #374151; }
    .meter-pct { color: #6952d9; }
    .meter-track { height: 12px; background: #eef2ff; border-radius: 999px; overflow: hidden; }
    .meter-fill { height: 100%; background: linear-gradient(90deg, #6b5ae6, #73a1ff); }
    .promo-card { background: #f7f4ff; border-color: #e7defe; padding: 1.2rem 1.3rem; }
    .promo-text { margin: 0; color: #313244; line-height: 1.6; font-size: 15px; }
    .badges-card { background: #fff; }
    .badges { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: .25rem; }
    .badge-chip { padding: .34rem .75rem; border-radius: 999px; background: #e7f0ff; color: #1849a9; font-size: 12px; font-weight: 700; border: 1px solid #d4e4ff; }
    .alerts-card { background: #fff; }
    .alerts-list { display: flex; flex-direction: column; gap: .7rem; }
    .alert-item { display: flex; justify-content: space-between; align-items: flex-start; gap: .8rem; border-left: 6px solid #93c5fd; border-radius: 14px; padding: .9rem .95rem; background: #f8fbff; border: 1px solid #e5edf8; }
    .alert-item.sev-high { background: #fff4f4; border-left-color: #ef4444; border-color: #fdd2d2; }
    .alert-item.sev-medium { background: #fffaf2; border-left-color: #f59e0b; border-color: #fde7c2; }
    .alert-item.sev-low { background: #f4f8ff; border-left-color: #60a5fa; border-color: #d8e6ff; }
    .alert-item.resolved { opacity: .82; filter: saturate(.82); }
    .alert-main { min-width: 0; flex: 1; }
    .alert-top { display: flex; align-items: center; gap: .55rem; flex-wrap: wrap; margin-bottom: .25rem; }
    .severity-pill { border-radius: 999px; padding: .22rem .58rem; font-size: 11px; font-weight: 800; letter-spacing: .03em; border: 1px solid transparent; }
    .severity-high { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
    .severity-medium { background: #ffedd5; color: #b45309; border-color: #fed7aa; }
    .severity-low { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
    .learner-name { font-size: 13px; font-weight: 700; color: #374151; }
    .alert-reason { margin: 0 0 .4rem; line-height: 1.5; color: #1f2937; font-size: 14px; }
    .reason-code { font-weight: 800; margin-right: .32rem; color: #374151; }
    .reason-message { color: #374151; }
    .alert-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .28rem; margin: 0; color: #6b7280; font-size: 12px; line-height: 1.45; }
    .meta-pill { background: #fff; border: 1px solid #d7deea; border-radius: 999px; padding: .1rem .44rem; font-weight: 700; color: #475467; }
    .meta-pill.meta-ok { background: #ecfdf3; border-color: #b7ebcb; color: #067647; }
    .meta-dot { color: #9aa4b2; }
    .recommendation { color: #475467; }
    .meta-path { color: #6b7280; }
    .alert-actions { display: flex; align-items: center; justify-content: flex-end; min-width: 160px; }
    .btn-alert { padding: .5rem .75rem; background: #fff; border: 1px solid #d5d8ee; color: #4a4b68; font-size: 12px; }
    .btn-alert:hover:not(:disabled) { background: #f7f8ff; border-color: #bfc4ea; }
    .resolved-chip { font-size: 12px; font-weight: 700; color: #067647; background: #ecfdf3; border: 1px solid #b7ebcb; border-radius: 999px; padding: .28rem .62rem; }
    .empty-state { border: 1px dashed #d3d9e8; border-radius: 12px; padding: .95rem 1rem; color: #667085; background: #fafbff; font-size: 14px; text-align: center; }
    .recs-card { background: #fff; }
    .recs { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: .75rem; }
    .rec { border: 1px solid #e7eaf5; border-radius: 14px; padding: .82rem .9rem; background: #fafbff; min-width: 0; }
    .rec-head { margin-bottom: .35rem; }
    .rec-source { font-size: 10px; font-weight: 800; border-radius: 999px; padding: .2rem .45rem; background: #eef2ff; color: #4338ca; border: 1px solid #dfe3ff; text-transform: uppercase; }
    .rec-title { margin: 0 0 .3rem; font-size: .97rem; color: #2f3e92; line-height: 1.35; }
    .rec-text { margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; }
    .banner.err { background: #fef2f2; color: #991b1b; padding: .75rem 1rem; border-radius: 10px; border: 1px solid #fecaca; }
    .banner.warn { background: #fff7ed; color: #9a3412; padding: .75rem 1rem; border-radius: 10px; border: 1px solid #fed7aa; }
    @media (max-width: 900px) {
      .alert-item { flex-direction: column; }
      .alert-actions { width: 100%; min-width: 0; justify-content: flex-start; }
    }
    @media (max-width: 640px) {
      .page { margin-top: 1.4rem; padding: 0 .8rem 2rem; }
      .card, .card-soft { padding: .9rem 1rem; border-radius: 14px; }
      h1 { font-size: 1.55rem; }
      .back-link { width: 100%; text-align: center; }
      .toolbar { justify-content: stretch; }
      .btn-primary { width: 100%; }
      .recs { grid-template-columns: 1fr; }
    }
  `]
})
export class AdaptiveProgressionComponent implements OnInit {
  profile: ProfileView | null = null;
  error = '';
  loading = false;
  resolvingAlertId: number | null = null;

  constructor(
    public keycloak: KeycloakService,
    private adaptive: AdaptiveModuleService,
    private userSync: UserSyncService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.keycloak.isLoggedIn()) {
      await this.userSync.syncCurrentUser();
      this.load();
    }
  }

  load(): void {
    if (!this.keycloak.isLoggedIn()) return;
    this.error = '';
    this.loading = true;
    this.adaptive.getProfileMe().subscribe({
      next: (res) => {
        this.profile = res;
        this.loading = false;
      },
      error: (e) => {
        if (this.shouldRedirectToLevelPage(e)) {
          this.loading = false;
          this.error = '';
          void this.router.navigate(['/adaptive/mon-niveau']);
          return;
        }
        this.error = readApiErrorMessage(e, 'Impossible de charger la progression.');
        this.loading = false;
      }
    });
  }

  private shouldRedirectToLevelPage(err: unknown): boolean {
    if (err instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(err);
      if (err.status === 404) {
        return true;
      }
      if (backendMessage.toLowerCase().includes('student profile not found')) {
        return true;
      }
    }
    return false;
  }

  private extractBackendMessage(err: HttpErrorResponse): string {
    const payload = err.error;
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return '';
  }

  badgeList(raw: string): string[] {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  displayObjective(p: ProfileView): string {
    return coherentObjectiveLevel(p.currentLevel, p.targetLevel);
  }

  parseReason(reason: string | null | undefined): { code: string | null; message: string } {
    const raw = (reason ?? '').trim();
    if (!raw) {
      return { code: null, message: 'Aucune raison fournie.' };
    }
    const m = raw.match(/^\[([A-Z0-9_]+)\]\s*(.*)$/);
    if (!m) {
      return { code: null, message: raw };
    }
    const code = m[1] ?? null;
    const message = (m[2] ?? '').trim() || raw;
    return { code, message };
  }

  recommendationForCode(code: string | null): string {
    switch (code) {
      case 'LEVEL_TEST_FAIL':
        return 'Recommander une revision ciblee avant nouvelle tentative.';
      case 'SLOW_PROGRESS':
        return 'Prevoir un accompagnement ou ajuster le rythme du parcours.';
      case 'ABSENCE_RISK':
        return 'Verifier l engagement de l etudiant et relancer si necessaire.';
      default:
        return 'Suivi pedagogique recommande.';
    }
  }

  formatAlertDate(raw: string | null | undefined): string {
    if (!raw) {
      return 'Date inconnue';
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      return raw;
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  markAlertResolved(alert: AlertView): void {
    if (!alert?.id || alert.resolved || this.resolvingAlertId != null) {
      return;
    }
    this.resolvingAlertId = alert.id;
    this.adaptive.resolveMyAlert(alert.id).subscribe({
      next: () => {
        if (!this.profile?.openAlerts) {
          this.resolvingAlertId = null;
          return;
        }
        this.profile.openAlerts = this.profile.openAlerts.map((a) =>
          a.id === alert.id ? { ...a, resolved: true } : a
        );
        this.resolvingAlertId = null;
      },
      error: (e) => {
        this.error = readApiErrorMessage(e, 'Impossible de marquer cette alerte comme traitée.');
        this.resolvingAlertId = null;
      }
    });
  }
}
