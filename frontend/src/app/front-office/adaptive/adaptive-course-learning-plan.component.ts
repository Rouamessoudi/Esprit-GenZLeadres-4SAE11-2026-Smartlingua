import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AdaptiveModuleService,
  ChapterProgressStatus,
  LearningPlanView,
  LearningPlanChapterView
} from '../../core/services/adaptive-module.service';
import { readApiErrorMessage } from '../../core/http-error.util';

@Component({
  selector: 'app-adaptive-course-learning-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="wrap">
      <header class="hero">
        <a routerLink="/courses" class="back">← Catalogue</a>
        <p class="kicker">Parcours du cours</p>
        <h1>{{ plan?.courseTitle ?? 'Learning plan' }}</h1>
        @if (plan) {
          <div class="identity">
            <span class="name">{{ plan.learnerFullName }}</span>
            <span class="email muted">{{ plan.learnerEmail }}</span>
          </div>
          <div class="stats">
            <div class="pill">CECRL {{ plan.currentCefrLevel }}</div>
            @if (plan.placementScore != null) {
              <div class="pill">Placement {{ plan.placementScore }}%</div>
            }
            <div class="pill progress-pill">
              Progression {{ plan.globalCompletionPercent | number: '1.0-0' }}%
            </div>
            @if (plan.finalTestEligible) {
              <div class="pill ok">Test final débloqué</div>
            } @else {
              <div class="pill warn">Test final : terminez les chapitres requis</div>
            }
          </div>
        }
      </header>

      @if (loading) {
        <p class="muted">Chargement…</p>
      }
      @if (error) {
        <div class="err">{{ error }}</div>
      }

      @if (plan && !loading) {
        <div class="ai-card">
          <div class="ai-head">
            <span class="material-icons-round">auto_awesome</span>
            <strong>Assistant IA</strong>
          </div>
          <p class="ai-body">{{ plan.assistantIaMessage }}</p>
        </div>

        @for (sec of plan.sections; track sec.skillType) {
          <section class="skill-block">
            <h2 class="skill-title">
              @switch (sec.skillType) {
                @case ('READING') { Lecture (Reading) }
                @case ('WRITING') { Écriture (Writing) }
                @case ('LISTENING') { Compréhension orale (Listening) }
                @default { {{ sec.skillType }} }
              }
            </h2>
            <div class="grid">
              @for (ch of sec.chapters; track ch.chapterId) {
                <article
                  class="chapter-card"
                  [class.done]="ch.progressStatus === 'COMPLETED'"
                  [class.progress]="ch.progressStatus === 'IN_PROGRESS'"
                >
                  <div class="ch-head">
                    <span class="badge">{{ statusLabel(ch.progressStatus) }}</span>
                    @if (ch.chapterRequired) {
                      <span class="req">Requis</span>
                    }
                  </div>
                  <h3>{{ ch.title }}</h3>
                  <p class="desc">{{ ch.description }}</p>
                  <ul class="res-list">
                    @for (c of ch.contents; track c.id) {
                      <li>
                        <span class="rtype">{{ c.type }}</span>
                        @if (c.url && c.url !== '#') {
                          <a [href]="c.url" target="_blank" rel="noopener">{{ c.title }}</a>
                        } @else {
                          {{ c.title }}
                        }
                      </li>
                    }
                  </ul>
                  <div class="actions">
                    @if (ch.progressStatus !== 'COMPLETED') {
                      <button
                        type="button"
                        class="btn ghost"
                        [disabled]="busyChapterId === ch.chapterId"
                        (click)="setChapterStatus(ch, 'IN_PROGRESS')"
                      >
                        Start
                      </button>
                      <button
                        type="button"
                        class="btn primary"
                        [disabled]="busyChapterId === ch.chapterId"
                        (click)="setChapterStatus(ch, 'COMPLETED')"
                      >
                        Done
                      </button>
                    } @else {
                      <span class="done-msg">Complété</span>
                      @if (ch.completedAt) {
                        <span class="muted small">{{ ch.completedAt | date: 'medium' }}</span>
                      }
                    }
                  </div>
                </article>
              }
            </div>
          </section>
        }
      }
    </section>
  `,
  styles: [
    `
      .wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
      }
      .hero {
        margin-bottom: 1.5rem;
      }
      .back {
        display: inline-block;
        margin-bottom: 0.5rem;
        color: #4f46e5;
        text-decoration: none;
        font-size: 14px;
      }
      .kicker {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        color: #64748b;
        margin: 0 0 0.25rem;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.75rem;
        color: #0f172a;
      }
      .identity {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        align-items: baseline;
        margin-bottom: 0.75rem;
      }
      .name {
        font-weight: 600;
        color: #1e293b;
      }
      .muted {
        color: #64748b;
      }
      .stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pill {
        font-size: 13px;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: #f1f5f9;
        color: #334155;
      }
      .pill.ok {
        background: #ecfdf5;
        color: #047857;
      }
      .pill.warn {
        background: #fffbeb;
        color: #b45309;
      }
      .progress-pill {
        background: #eef2ff;
        color: #4338ca;
        font-weight: 600;
      }
      .err {
        padding: 0.75rem 1rem;
        background: #fef2f2;
        color: #b91c1c;
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      .ai-card {
        border: 1px solid #c7d2fe;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #eef2ff 0%, #fff 100%);
      }
      .ai-head {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
        color: #3730a3;
      }
      .ai-body {
        margin: 0;
        line-height: 1.55;
        color: #334155;
        font-size: 15px;
      }
      .skill-block {
        margin-bottom: 2rem;
      }
      .skill-title {
        font-size: 1.2rem;
        margin: 0 0 1rem;
        color: #0f172a;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.35rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }
      .chapter-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem;
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .chapter-card.progress {
        border-color: #93c5fd;
        background: #eff6ff;
      }
      .chapter-card.done {
        border-color: #6ee7b7;
        background: #f0fdf4;
      }
      .ch-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
      .badge {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        background: #f1f5f9;
        color: #475569;
      }
      .req {
        font-size: 11px;
        color: #b45309;
      }
      h3 {
        margin: 0;
        font-size: 1.05rem;
        color: #1e293b;
      }
      .desc {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.45;
        flex: 1;
      }
      .res-list {
        margin: 0;
        padding-left: 1.1rem;
        font-size: 13px;
        color: #334155;
      }
      .rtype {
        font-size: 10px;
        font-weight: 700;
        color: #6366f1;
        margin-right: 0.35rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-top: auto;
        padding-top: 0.5rem;
      }
      .btn {
        border-radius: 8px;
        padding: 0.4rem 0.85rem;
        font-size: 13px;
        cursor: pointer;
        border: none;
      }
      .btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn.ghost {
        background: #fff;
        border: 1px solid #cbd5e1;
        color: #334155;
      }
      .btn.primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
      }
      .done-msg {
        font-weight: 600;
        color: #047857;
        font-size: 14px;
      }
      .small {
        font-size: 12px;
      }
    `
  ]
})
export class AdaptiveCourseLearningPlanComponent implements OnInit {
  courseId!: number;
  plan: LearningPlanView | null = null;
  loading = true;
  error: string | null = null;
  busyChapterId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adaptive: AdaptiveModuleService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('courseId');
    const n = id != null ? Number(id) : NaN;
    if (!Number.isFinite(n)) {
      void this.router.navigate(['/courses']);
      return;
    }
    this.courseId = n;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.adaptive.getLearningPlanMe(this.courseId).subscribe({
      next: (p) => {
        this.plan = p;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = readApiErrorMessage(
          e,
          'Impossible de charger le parcours. Avez-vous cliqué sur « Enroll » ? (inscription requise).'
        );
      }
    });
  }

  statusLabel(s: ChapterProgressStatus): string {
    switch (s) {
      case 'NOT_STARTED':
        return 'Not started';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return s;
    }
  }

  setChapterStatus(ch: LearningPlanChapterView, status: ChapterProgressStatus): void {
    this.busyChapterId = ch.chapterId;
    this.adaptive.updateChapterStatusMe(this.courseId, ch.chapterId, status).subscribe({
      next: () => this.load(),
      error: (e) => {
        this.busyChapterId = null;
        this.error = readApiErrorMessage(e, 'Mise à jour impossible.');
      },
      complete: () => {
        this.busyChapterId = null;
      }
    });
  }
}
