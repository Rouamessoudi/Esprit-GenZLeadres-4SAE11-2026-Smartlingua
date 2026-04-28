import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AiCoachResponse,
  AiCoachService,
  CoachAdviceType,
  CoachRecommendationItem
} from '../../core/services/ai-coach.service';
import { UserSyncService } from '../../core/user-sync.service';

@Component({
  selector: 'app-ai-coach-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="coach-page">
      <div class="container">
        <header class="hero">
          <span class="pill">
            <span class="material-icons-round">psychology</span>
            AI Coach
          </span>
          <h1>Coach IA personnalisé</h1>
          <p class="lead">
            Conseils basés sur votre niveau CECRL, votre progression sur le parcours et des règles pédagogiques
            (révisions, compétences, planning). Les avis sont enregistrés pour historique.
          </p>
        </header>

        <div class="toolbar card">
          <label for="learner">Apprenant</label>
          <input id="learner" type="text" [value]="learnerDisplayName || 'Connectez-vous pour utiliser le coach à votre nom'" readonly />
          <button type="button" class="btn primary" (click)="askCoach()" [disabled]="loading || studentId < 1">
            @if (loading) {
              <span class="spin material-icons-round">progress_activity</span>
            } @else {
              <span class="material-icons-round">auto_awesome</span>
            }
            Ask AI Coach
          </button>
          <a routerLink="/learning-profile" class="link-subtle">Ajuster le profil apprenant</a>
          <a routerLink="/learning-path" class="link-subtle">Voir le parcours</a>
        </div>

        @if (errorMsg) {
          <div class="alert err" role="alert">{{ errorMsg }}</div>
        }

        @if (result) {
          <div class="grid">
            <aside class="card profile-card">
              <h2>Profil analysé</h2>
              <ul class="kv">
                <li><span>Niveau perf.</span><strong>{{ result.profile.level }}</strong></li>
                <li><span>Score</span><strong>{{ result.profile.score | number: '1.0-1' }} %</strong></li>
                <li><span>Progression</span><strong>{{ result.profile.progress }} %</strong></li>
                <li><span>Leçons / étapes faites</span><strong>{{ result.profile.lessonsCompleted }}</strong></li>
                <li><span>Anglais (CECRL)</span><strong>{{ result.profile.englishLevel }}</strong></li>
              </ul>
            </aside>

            <div class="main-col">
              @if (result.dailyAdvice) {
                <div class="card highlight daily">
                  <h3><span class="material-icons-round">wb_sunny</span> Conseil du jour</h3>
                  <p>{{ result.dailyAdvice }}</p>
                </div>
              }
              @if (result.progressImprovementSuggestion) {
                <div class="card highlight progress">
                  <h3><span class="material-icons-round">trending_up</span> Progression</h3>
                  <p>{{ result.progressImprovementSuggestion }}</p>
                </div>
              }

              <div class="card list-card">
                <h2>Recommandations</h2>
                <ul class="rec-list">
                  @for (r of sortedRecs(result.recommendations); track r.id) {
                    <li [class]="'rec type-' + r.type">
                      <span class="type-pill">{{ typeLabel(r.type) }}</span>
                      <p>{{ r.message }}</p>
                      <time>{{ r.createdAt | date: 'short' }}</time>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .coach-page {
      padding: 2rem 0 4rem;
      background: linear-gradient(180deg, #f4f2fb 0%, #fff 35%);
      min-height: 60vh;
    }
    .container { max-width: 1040px; margin: 0 auto; padding: 0 1.25rem; }
    .hero { margin-bottom: 1.75rem; }
    .hero h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0.5rem 0; color: #1a1a2e; }
    .lead { color: #64748b; max-width: 52rem; line-height: 1.55; margin: 0; }
    .pill {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: #ede9fe; color: #5b4cdb; padding: 0.25rem 0.75rem; border-radius: 999px;
      font-size: 0.8rem; font-weight: 600;
    }
    .card {
      background: #fff; border-radius: 16px; border: 1px solid #e8e4f5;
      box-shadow: 0 4px 24px rgba(108, 92, 231, 0.07);
    }
    .toolbar {
      display: flex; flex-wrap: wrap; align-items: flex-end; gap: 1rem;
      padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
    }
    .toolbar label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem; }
    .toolbar input {
      min-width: 200px; flex: 1; max-width: 360px; padding: 0.55rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 1rem;
    }
    .btn.primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #6c5ce7; color: #fff; border: none; padding: 0.65rem 1.2rem; border-radius: 12px;
      font-weight: 600; cursor: pointer;
    }
    .btn.primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .spin { animation: spin 0.85s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .link-subtle { font-size: 0.88rem; color: #6c5ce7; text-decoration: none; align-self: center; }
    .link-subtle:hover { text-decoration: underline; }
    .alert.err { background: #fef2f2; color: #b91c1c; padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid #fecaca; }
    .grid { display: grid; grid-template-columns: minmax(240px, 280px) 1fr; gap: 1.25rem; align-items: start; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
    .profile-card { padding: 1.35rem; }
    .profile-card h2 { margin: 0 0 1rem; font-size: 1.05rem; color: #1a1a2e; }
    .kv { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    .kv li { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.88rem; border-bottom: 1px dashed #e8e4f5; padding-bottom: 0.5rem; }
    .kv li:last-child { border-bottom: none; }
    .kv span { color: #64748b; }
    .main-col { display: flex; flex-direction: column; gap: 1rem; }
    .highlight { padding: 1.15rem 1.35rem; }
    .highlight h3 { margin: 0 0 0.5rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem; color: #1a1a2e; }
    .highlight p { margin: 0; color: #475569; line-height: 1.5; font-size: 0.92rem; }
    .daily { border-left: 4px solid #f59e0b; }
    .progress { border-left: 4px solid #10b981; }
    .list-card { padding: 1.35rem; }
    .list-card h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .rec-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.85rem; }
    .rec {
      padding: 1rem 1.1rem; border-radius: 12px; background: #fafaff; border: 1px solid #ece8f8;
    }
    .type-pill {
      display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; padding: 0.2rem 0.5rem; border-radius: 6px;
      background: #e0e7ff; color: #4338ca; margin-bottom: 0.45rem;
    }
    .rec p { margin: 0 0 0.35rem; color: #334155; font-size: 0.9rem; line-height: 1.5; }
    .rec time { font-size: 0.75rem; color: #94a3b8; }
  `]
})
export class AiCoachPageComponent implements OnInit {
  studentId = 0;
  learnerDisplayName = '';
  loading = false;
  errorMsg: string | null = null;
  result: AiCoachResponse | null = null;

  constructor(private coachApi: AiCoachService, private userSync: UserSyncService) {}

  ngOnInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const id = await this.userSync.resolveStudentId();
    this.studentId = id ?? 0;
    this.learnerDisplayName = this.userSync.getStoredStudentDisplayName();
  }

  askCoach(): void {
    if (this.studentId < 1) {
      this.errorMsg = 'Connectez-vous : votre compte est reconnu automatiquement (aucun identifiant à saisir).';
      return;
    }
    this.loading = true;
    this.errorMsg = null;
    this.coachApi.askCoach(this.studentId).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
      },
      error: (e: { error?: { message?: string }; message?: string; status?: number }) => {
        this.loading = false;
        this.errorMsg =
          (typeof e?.error === 'object' && e.error?.message) ||
          (typeof e?.error === 'string' ? e.error : null) ||
          e?.message ||
          'Requête impossible. Démarrez la gateway (8093), adaptive-learning (8094), MySQL et Eureka si besoin.';
      }
    });
  }

  sortedRecs(list: CoachRecommendationItem[]): CoachRecommendationItem[] {
    return [...list].sort((a, b) => (a.type > b.type ? 1 : a.type < b.type ? -1 : 0));
  }

  typeLabel(t: CoachAdviceType): string {
    const map: Record<CoachAdviceType, string> = {
      REVISION: 'Révision',
      SKILL_FOCUS: 'Compétence',
      STUDY_PLAN: 'Planning',
      MOTIVATION: 'Motivation',
      DAILY: 'Quotidien',
      PROGRESS: 'Progression'
    };
    return map[t] ?? t;
  }
}
