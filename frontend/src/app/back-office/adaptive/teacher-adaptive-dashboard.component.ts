import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdaptiveModuleService,
  AlertView,
  LearnerPickerEntry,
  TeacherAdaptiveDashboardDto
} from '../../core/services/adaptive-module.service';

@Component({
  selector: 'app-teacher-adaptive-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="wrap">
      <header class="top">
        <div>
          <p class="eyebrow">Back-office</p>
          <h1>Adaptive — Pilotage</h1>
          <p class="muted">KPI, alertes et recommandations. Sélectionnez un apprenant par nom pour contextualiser (démo).</p>
        </div>
        <a routerLink="/admin/dashboard" class="link">← Dashboard admin</a>
      </header>

      <div class="picker card" *ngIf="learners.length">
        <label>Filtrer / contextualiser par apprenant</label>
        <select [(ngModel)]="selectedLearnerId" (ngModelChange)="onLearnerChange()">
          <option [ngValue]="null">— Tous les apprenants —</option>
          @for (l of learners; track l.id) {
            <option [ngValue]="l.id">{{ l.fullName }} · {{ l.email || 'sans email' }}</option>
          }
        </select>
        <p class="hint" *ngIf="selectedLearnerId != null">Données agrégées inchangées ; la zone ci-dessous résume l’apprenant sélectionné.</p>
      </div>

      @if (error) {
        <p class="err">{{ error }}</p>
      }

      @if (dash) {
        <div class="kpis">
          <div class="kpi"><div class="n">{{ dash.studentsWithProfile }}</div><div class="l">Profils</div></div>
          <div class="kpi"><div class="n">{{ dash.activeLearningPaths }}</div><div class="l">Parcours actifs</div></div>
          <div class="kpi"><div class="n">{{ dash.averageCompletionPercent ?? '—' }}{{ dash.averageCompletionPercent != null ? '%' : '' }}</div><div class="l">Complétion moy.</div></div>
          <div class="kpi warn"><div class="n">{{ dash.openAlerts }}</div><div class="l">Alertes ouvertes</div></div>
          <div class="kpi warn"><div class="n">{{ dash.studentsWithOpenAlerts }}</div><div class="l">Étudiants concernés</div></div>
          <div class="kpi"><div class="n">{{ dash.recommendationsLast7Days }}</div><div class="l">Reco. 7j</div></div>
          <div class="kpi"><div class="n">{{ dash.recommendationsTotalActive }}</div><div class="l">Reco. actives</div></div>
        </div>

        <div class="split">
          <section class="panel">
            <h2>Alertes récentes</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Apprenant</th>
                  <th>Gravité</th>
                  <th>Détail</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (a of filteredAlerts; track a.id) {
                  <tr>
                    <td>{{ a.createdAt | date:'short' }}</td>
                    <td class="name">{{ displayLearnerName(a) }}</td>
                    <td><span class="sev" [attr.data-s]="a.severity">{{ a.severity }}</span></td>
                    <td class="reason">{{ shortReason(a) }}</td>
                    <td>
                      <button type="button" class="btn-resolve" [disabled]="resolvingId === a.id" (click)="resolve(a)">Résoudre</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <section class="panel">
            <h2>Dernières recommandations</h2>
            <ul class="rec-list">
              @for (r of dash.latestRecommendations; track r.id) {
                <li>
                  <span class="pill">{{ r.source }}</span>
                  <strong>{{ r.itemTitle }}</strong>
                  <p>{{ r.personalizedText }}</p>
                </li>
              }
            </ul>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .wrap { padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: system-ui, sans-serif; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; color: #6366f1; margin: 0; font-weight: 600; }
    h1 { margin: .25rem 0; font-size: 1.5rem; }
    .muted { color: #64748b; margin: 0; font-size: 14px; max-width: 560px; }
    .link { font-weight: 600; color: #4f46e5; text-decoration: none; align-self: center; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    .picker label { display: block; font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: .35rem; }
    .picker select { min-width: 280px; max-width: 100%; padding: .5rem .75rem; border-radius: 8px; border: 1px solid #cbd5e1; }
    .hint { font-size: 12px; color: #64748b; margin: .5rem 0 0; }
    .err { color: #b91c1c; background: #fef2f2; padding: .75rem 1rem; border-radius: 10px; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0 24px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 18px; min-width: 150px; background: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.05); }
    .kpi.warn { border-color: #fed7aa; background: #fffbeb; }
    .n { font-size: 26px; font-weight: 700; color: #0f172a; }
    .l { color: #64748b; font-size: 12px; margin-top: 4px; }
    .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; align-items: start; }
    .panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1rem; box-shadow: 0 4px 14px rgba(15,23,42,.05); }
    h2 { margin: 0 0 12px; font-size: 1.05rem; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #f1f5f9; padding: 8px; text-align: left; vertical-align: top; }
    .name { font-weight: 600; color: #0f172a; }
    .reason { max-width: 220px; color: #475569; }
    .sev { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #e2e8f0; }
    .sev[data-s="HIGH"] { background: #fee2e2; color: #991b1b; }
    .sev[data-s="MEDIUM"] { background: #ffedd5; color: #9a3412; }
    .sev[data-s="LOW"] { background: #e0f2fe; color: #075985; }
    .btn-resolve { padding: 6px 10px; border-radius: 8px; border: 1px solid #6366f1; background: #fff; color: #4f46e5; cursor: pointer; font-weight: 600; font-size: 12px; }
    .btn-resolve:disabled { opacity: 0.5; cursor: default; }
    .rec-list { list-style: none; margin: 0; padding: 0; }
    .rec-list li { border: 1px solid #f1f5f9; border-radius: 10px; padding: 10px; margin-bottom: 8px; background: #f8fafc; }
    .rec-list p { margin: 6px 0 0; font-size: 13px; color: #475569; line-height: 1.4; }
    .pill { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: #ede9fe; color: #5b21b6; margin-right: 6px; }
  `]
})
export class TeacherAdaptiveDashboardComponent implements OnInit {
  dash: TeacherAdaptiveDashboardDto | null = null;
  learners: LearnerPickerEntry[] = [];
  selectedLearnerId: number | null = null;
  error: string | null = null;
  resolvingId: number | null = null;

  constructor(private adaptive: AdaptiveModuleService) {}

  ngOnInit(): void {
    this.refresh();
    this.adaptive.teacherLearners().subscribe({
      next: (list) => (this.learners = list),
      error: () => { /* liste optionnelle */ }
    });
  }

  get filteredAlerts(): AlertView[] {
    if (!this.dash) return [];
    if (this.selectedLearnerId == null) return this.dash.latestOpenAlerts;
    return this.dash.latestOpenAlerts.filter((a) => a.studentId === this.selectedLearnerId);
  }

  displayLearnerName(a: AlertView): string {
    return (a.learnerFullName && a.learnerFullName.trim()) ? a.learnerFullName : 'Apprenant';
  }

  refresh(): void {
    this.error = null;
    this.adaptive.teacherDashboard().subscribe({
      next: (d) => (this.dash = d),
      error: (e) => (this.error = e?.error?.message ?? 'Chargement impossible (rôle enseignant / admin requis).')
    });
  }

  shortReason(a: AlertView): string {
    const r = a.reason ?? '';
    return r.length > 120 ? r.slice(0, 117) + '…' : r;
  }

  onLearnerChange(): void {
    /* filtrage local uniquement */
  }

  resolve(a: AlertView): void {
    this.resolvingId = a.id;
    this.adaptive.resolveTeacherAlert(a.id).subscribe({
      next: () => {
        this.resolvingId = null;
        this.refresh();
      },
      error: () => (this.resolvingId = null)
    });
  }
}
