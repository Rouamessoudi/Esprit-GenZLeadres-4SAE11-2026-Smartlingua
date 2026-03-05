import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseApiService, CourseDto, ResourceDto, ResourceType, SeanceDto, CourseSummaryDto, ResourcesSummaryDto, SeancesSummaryDto, CourseCompletionDto, SeanceWithCourseDto } from '../../core/services/course-api.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="detail-page">
      <div class="page-header animate-fade-in-up">
        <div>
          <h1>Ressources et séances</h1>
          <p class="page-subtitle">@if (course) { {{ course.title }} — } Vue d’ensemble et gestion des contenus du cours.</p>
        </div>
        <a [routerLink]="['/admin/courses']" class="btn btn-outline btn-sm">
          <span class="material-icons-round">arrow_back</span>
          Retour à la liste
        </a>
      </div>

    @if (loading) {
      <div class="loading-state">
        <span class="material-icons-round spin">refresh</span>
        <p>Chargement...</p>
      </div>
    } @else if (!course) {
      <div class="error-box animate-fade-in-up">
        <span class="material-icons-round error-icon">error_outline</span>
        <p class="error-title">Cours introuvable</p>
        <p class="error-desc">L’identifiant dans l’URL est invalide ou ce cours n’existe pas (ou a été supprimé).</p>
        <a [routerLink]="['/admin/courses']" class="btn btn-primary">Retour à la liste</a>
      </div>
    } @else {
      <!-- Indicateurs et résumés (présentation pro) -->
      <div class="indicators-row animate-fade-in-up">
        @if (completionStatus) {
          <span class="completion-badge" [class.complete]="completionStatus.complete" [class.incomplete]="!completionStatus.complete">
            {{ completionStatus.complete ? 'Cours complet' : 'À compléter' }}
          </span>
        }
        @if (nextSeance) {
          <span class="next-seance-msg">
            <span class="material-icons-round">schedule</span>
            Prochaine séance : {{ formatSeanceDate(nextSeance.startDateTime) }} – {{ nextSeance.title }} ({{ nextSeance.durationMinutes }} min)
          </span>
        } @else if (seancesSummary && seancesSummary.totalSeances > 0) {
          <span class="next-seance-msg muted">Aucune séance à venir pour ce cours.</span>
        }
      </div>

      <div class="stats-row animate-fade-in-up">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(108,92,231,0.12);">
            <span class="material-icons-round" style="color: var(--primary);">school</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ summary?.resourceCount ?? 0 }} / {{ summary?.seanceCount ?? 0 }}</span>
            <span class="stat-label">Ressources / Séances</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(0,206,201,0.12);">
            <span class="material-icons-round" style="color: var(--accent);">folder</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ resourcesSummary?.total ?? 0 }}</span>
            <span class="stat-label">Ressources (PDF {{ resourcesSummary?.byType?.['PDF'] ?? 0 }}, VIDEO {{ resourcesSummary?.byType?.['VIDEO'] ?? 0 }}, AUDIO {{ resourcesSummary?.byType?.['AUDIO'] ?? 0 }})</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(0,184,148,0.12);">
            <span class="material-icons-round" style="color: var(--success);">event</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ seancesSummary?.totalSeances ?? 0 }}</span>
            <span class="stat-label">{{ seancesSummary?.upcomingCount ?? 0 }} à venir · {{ seancesSummary?.totalDurationMinutes ?? 0 }} min total</span>
          </div>
        </div>
        <button type="button" class="btn-refresh-stats" (click)="refreshMetierSummaries()" title="Rafraîchir les résumés">
          <span class="material-icons-round">refresh</span>
          Rafraîchir
        </button>
      </div>

      <div class="cards-grid animate-fade-in-up">
        <!-- Card Ressources -->
        <section class="card animate-fade-in-up" style="animation-delay: 0.08s">
          <div class="card-top">
            <h3>Ressources</h3>
          </div>
          <div class="card-body">
            <p class="card-subtitle">Ajoutez des supports (PDF, vidéos, audio) pour ce cours.</p>
            <form [formGroup]="resourceForm" (ngSubmit)="addResource()" class="add-form">
              <input formControlName="title" placeholder="Titre (min. 2 caractères)" class="form-input">
              <select formControlName="type" class="form-select">
                @for (t of resourceTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
              <input formControlName="url" placeholder="URL (http:// ou https://)" class="form-input form-input-wide" type="url">
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="resourceForm.invalid">
                <span class="material-icons-round">add</span>
                Ajouter
              </button>
            </form>
            @if (resourceForm.get('title')?.invalid && resourceForm.get('title')?.touched) {
              <span class="error-msg">{{ getResourceTitleError() }}</span>
            }
            @if (resourceForm.get('url')?.invalid && resourceForm.get('url')?.touched) {
              <span class="error-msg">{{ getResourceUrlError() }}</span>
            }
            @if (resourceSubmitError) {
              <p class="error-msg">{{ resourceSubmitError }}</p>
            }

            <div class="list-wrap">
              @if (resources.length === 0) {
                <div class="empty-state">
                  <span class="material-icons-round">folder_open</span>
                  <p>Aucune ressource pour l’instant. Ajoutez-en une avec le formulaire ci-dessus.</p>
                </div>
              } @else {
                @for (r of resources; track r.id) {
                  <div class="perf-item">
                    <div class="perf-icon" [ngClass]="'perf-icon-' + r.type.toLowerCase()">
                      <span class="material-icons-round">{{ getResourceIcon(r.type) }}</span>
                    </div>
                    <div class="perf-info">
                      <strong>{{ r.title }}</strong>
                      <span class="perf-meta">
                        <span class="status-badge" [ngClass]="'badge-' + r.type.toLowerCase()">{{ r.type }}</span>
                      </span>
                    </div>
                    <div class="perf-actions">
                      <a [href]="r.url" target="_blank" class="link-btn">Ouvrir</a>
                      <button type="button" class="btn-icon btn-danger" (click)="deleteResource(r)" title="Supprimer">
                        <span class="material-icons-round">delete_outline</span>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </section>

        <!-- Card Séances -->
        <section class="card animate-fade-in-up" style="animation-delay: 0.12s">
          <div class="card-top">
            <h3>Séances</h3>
          </div>
          <div class="card-body">
            <p class="card-subtitle">Planifiez les séances (date, heure, durée).</p>
            <form [formGroup]="seanceForm" (ngSubmit)="addSeance()" class="add-form">
              <input formControlName="title" placeholder="Titre séance" class="form-input">
              <input type="datetime-local" formControlName="startDateTime" class="form-input form-datetime">
              <input type="number" formControlName="durationMinutes" placeholder="Durée (min)" min="1" class="form-input form-num">
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="seanceForm.invalid">
                <span class="material-icons-round">add</span>
                Ajouter
              </button>
            </form>
            @if (seanceForm.get('title')?.invalid && seanceForm.get('title')?.touched) {
              <span class="error-msg">Titre obligatoire.</span>
            }

            <div class="list-wrap">
              @if (seances.length === 0) {
                <div class="empty-state">
                  <span class="material-icons-round">event_available</span>
                  <p>Aucune séance pour l’instant. Elles apparaîtront dans « Prochaines séances » sur la liste des cours.</p>
                </div>
              } @else {
                @for (s of seances; track s.id) {
                  <div class="perf-item">
                    <div class="perf-icon perf-icon-seance">
                      <span class="material-icons-round">event</span>
                    </div>
                    <div class="perf-info">
                      <strong>{{ s.title }}</strong>
                      <span class="perf-meta">{{ formatSeanceDate(s.startDateTime) }} · {{ s.durationMinutes }} min</span>
                    </div>
                    <div class="perf-actions">
                      <button type="button" class="btn-icon btn-danger" (click)="deleteSeance(s)" title="Supprimer">
                        <span class="material-icons-round">delete_outline</span>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .detail-page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .page-header h1 { font-size: 1.8rem; font-weight: 800; color: var(--text); margin-bottom: 4px; }
    .page-header p.page-subtitle { font-size: 0.95rem; color: var(--text-light); }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: var(--radius-sm); border: none; cursor: pointer; font-size: 0.88rem; font-weight: 600; text-decoration: none; transition: var(--transition); }
    .btn-sm { padding: 8px 14px; font-size: 0.82rem; }
    .btn .material-icons-round { font-size: 1rem; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.05); box-shadow: var(--shadow-primary); }
    .btn-outline { background: #fff; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: rgba(108,92,231,0.04); }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; color: var(--text-muted); }
    .loading-state .material-icons-round.spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-box { padding: 32px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); max-width: 480px; text-align: center; }
    .error-box .error-icon { font-size: 2.5rem; color: var(--danger); margin-bottom: 12px; }
    .error-box .error-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
    .error-box .error-desc { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px; position: relative; }
    .stat-card { background: #fff; border-radius: var(--radius-lg); padding: 24px; display: flex; align-items: flex-start; gap: 16px; border: 1px solid var(--border); transition: var(--transition); }
    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .stat-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon .material-icons-round { font-size: 1.4rem; }
    .stat-info .stat-value { display: block; font-size: 1.4rem; font-weight: 800; color: var(--text); line-height: 1.2; }
    .stat-info .stat-label { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; display: block; }
    .btn-refresh-stats { position: absolute; top: 24px; right: 0; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.82rem; font-weight: 600; color: var(--primary); background: rgba(108,92,231,0.08); border: 1px solid rgba(108,92,231,0.2); border-radius: 8px; cursor: pointer; transition: var(--transition); }
    .btn-refresh-stats:hover { background: rgba(108,92,231,0.12); }
    .btn-refresh-stats .material-icons-round { font-size: 1rem; }
    .indicators-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 20px; }
    .metier-badges { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 20px; }
    .completion-badge { padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .completion-badge.complete { background: rgba(0,184,148,0.15); color: var(--success); }
    .completion-badge.incomplete { background: rgba(253,203,110,0.2); color: #d63031; }
    .next-seance-msg { display: inline-flex; align-items: center; gap: 6px; font-size: 0.88rem; color: var(--text); }
    .next-seance-msg .material-icons-round { font-size: 1rem; color: var(--primary); }
    .next-seance-msg.muted { color: var(--text-muted); }
    .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding-bottom: 24px; transition: var(--transition); }
    .card:hover { box-shadow: var(--shadow-md); }
    .card-top { display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0; margin-bottom: 12px; }
    .card-top h3 { font-size: 1.05rem; font-weight: 700; color: var(--text); }
    .card-body { padding: 0 24px 24px; }
    .card-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px; }
    .add-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
    .form-input, .form-select { padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.88rem; background: #fff; transition: border-color 0.2s, box-shadow 0.2s; }
    .form-input:focus, .form-select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(108,92,231,0.12); }
    .form-input { min-width: 140px; }
    .form-input-wide { flex: 1; min-width: 180px; }
    .form-datetime { min-width: 180px; }
    .form-num { width: 90px; }
    .error-msg { color: var(--danger); font-size: 0.82rem; display: block; margin-top: 4px; }
    .list-wrap { margin-top: 16px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 16px; background: rgba(0,0,0,0.02); border-radius: var(--radius-md); }
    .empty-state .material-icons-round { font-size: 2rem; color: var(--text-muted); }
    .empty-state p { font-size: 0.88rem; color: var(--text-muted); text-align: center; margin: 0; }
    .perf-item { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(0,0,0,0.04); }
    .perf-item:last-child { border-bottom: none; }
    .perf-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .perf-icon .material-icons-round { font-size: 1.1rem; color: #fff; }
    .perf-icon-pdf { background: linear-gradient(135deg, #e17055, #d63031); }
    .perf-icon-video { background: linear-gradient(135deg, #0984e3, #74b9ff); }
    .perf-icon-audio { background: linear-gradient(135deg, #00b894, #00cec9); }
    .perf-icon-seance { background: linear-gradient(135deg, #00b894, #00cec9); }
    .perf-info { flex: 1; min-width: 0; }
    .perf-info strong { display: block; font-size: 0.88rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .perf-meta { font-size: 0.76rem; color: var(--text-muted); display: block; margin-top: 2px; }
    .perf-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .link-btn { font-size: 0.82rem; font-weight: 600; color: var(--primary); text-decoration: none; }
    .link-btn:hover { text-decoration: underline; }
    .btn-icon { width: 36px; height: 36px; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: var(--text-muted); transition: var(--transition); }
    .btn-icon:hover { background: rgba(225,112,85,0.1); color: var(--danger); }
    .btn-icon .material-icons-round { font-size: 1.2rem; }
    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
    .badge-pdf { background: rgba(225,112,85,0.12); color: #d63031; }
    .badge-video { background: rgba(9,132,227,0.12); color: #0984e3; }
    .badge-audio { background: rgba(0,184,148,0.12); color: var(--success); }
    @media (max-width: 1024px) { .cards-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: 1fr; } .btn-refresh-stats { position: static; margin-top: 12px; } }
    @media (max-width: 768px) { .page-header { flex-direction: column; } }
  `]
})
export class CourseDetailComponent implements OnInit {
  courseId!: number;
  course: CourseDto | null = null;
  summary: CourseSummaryDto | null = null;
  resourcesSummary: ResourcesSummaryDto | null = null;
  seancesSummary: SeancesSummaryDto | null = null;
  completionStatus: CourseCompletionDto | null = null;
  nextSeance: SeanceWithCourseDto | null = null;
  resources: ResourceDto[] = [];
  seances: SeanceDto[] = [];
  loading = true;
  resourceSubmitError: string | null = null;
  resourceForm: FormGroup;
  seanceForm: FormGroup;
  resourceTypes: ResourceType[] = ['PDF', 'VIDEO', 'AUDIO'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: CourseApiService,
    private fb: FormBuilder
  ) {
    this.resourceForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      type: ['PDF', [Validators.required]],
      url: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/^https?:\/\/.+/)]]
    });
    this.seanceForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      startDateTime: ['', [Validators.required]],
      durationMinutes: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
      description: ['']
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.router.navigate(['/admin/courses']);
      return;
    }
    const id = +idParam;
    if (Number.isNaN(id) || id < 1) {
      this.router.navigate(['/admin/courses']);
      return;
    }
    this.courseId = id;
    this.api.getCourse(this.courseId).subscribe({
      next: (c) => {
        this.course = c;
        this.loading = false;
        this.loadResources();
        this.loadSeances();
        this.loadSummary();
        this.loadResourcesSummary();
        this.loadSeancesSummary();
        this.loadCompletionStatus();
        this.loadNextSeance();
      },
      error: () => { this.loading = false; }
    });
  }

  loadResourcesSummary() {
    this.api.getResourcesSummary(this.courseId).subscribe({
      next: (s) => this.resourcesSummary = s,
      error: () => this.resourcesSummary = null
    });
  }

  loadSeancesSummary() {
    this.api.getSeancesSummary(this.courseId).subscribe({
      next: (s) => this.seancesSummary = s,
      error: () => this.seancesSummary = null
    });
  }

  loadSummary() {
    this.api.getCourseSummary(this.courseId).subscribe({
      next: (s) => this.summary = s,
      error: () => this.summary = null
    });
  }

  refreshMetierSummaries() {
    this.loadSummary();
    this.loadResourcesSummary();
    this.loadSeancesSummary();
    this.loadCompletionStatus();
    this.loadNextSeance();
  }

  loadCompletionStatus() {
    this.api.getCourseCompletionStatus(this.courseId).subscribe({
      next: (s) => this.completionStatus = s,
      error: () => this.completionStatus = null
    });
  }

  loadNextSeance() {
    this.api.getNextSeanceForCourse(this.courseId).subscribe({
      next: (s) => this.nextSeance = s,
      error: () => this.nextSeance = null
    });
  }

  formatSeanceDate(isoDate: string): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getResourceTitleError(): string {
    const c = this.resourceForm.get('title');
    if (!c?.errors) return '';
    if (c.errors['required']) return 'Le titre est obligatoire.';
    if (c.errors['minlength']) return 'Le titre doit faire au moins 2 caractères.';
    if (c.errors['maxlength']) return 'Le titre est trop long.';
    return 'Titre invalide.';
  }

  getResourceUrlError(): string {
    const c = this.resourceForm.get('url');
    if (!c?.errors) return '';
    if (c.errors['required']) return "L'URL est obligatoire.";
    if (c.errors['pattern']) return "L'URL doit commencer par http:// ou https://.";
    if (c.errors['maxlength']) return "L'URL est trop longue.";
    return "URL invalide.";
  }

  getResourceIcon(type: string): string {
    switch (type) {
      case 'PDF': return 'picture_as_pdf';
      case 'VIDEO': return 'videocam';
      case 'AUDIO': return 'audiotrack';
      default: return 'insert_drive_file';
    }
  }

  loadResources() {
    this.api.getResources(this.courseId).subscribe(data => this.resources = data);
  }

  loadSeances() {
    this.api.getSeances(this.courseId).subscribe(data => this.seances = data);
  }

  addResource() {
    if (this.resourceForm.invalid) return;
    this.resourceSubmitError = null;
    const v = this.resourceForm.value;
    this.api.addResource(this.courseId, { title: v.title, type: v.type, url: v.url }).subscribe({
      next: (r) => {
        this.resources = [...this.resources, r];
        this.resourceForm.reset({ type: 'PDF' });
        this.loadSummary();
        this.loadResourcesSummary();
      },
      error: (err) => {
        this.resourceSubmitError = err?.error?.message || err?.message || 'Erreur lors de l\'ajout de la ressource.';
      }
    });
  }

  deleteResource(r: ResourceDto) {
    if (!r.id || !confirm('Supprimer cette ressource ?')) return;
    this.api.deleteResource(this.courseId, r.id).subscribe({
      next: () => { this.resources = this.resources.filter(x => x.id !== r.id); this.loadSummary(); this.loadResourcesSummary(); }
    });
  }

  addSeance() {
    if (this.seanceForm.invalid) return;
    const v = this.seanceForm.value;
    const start = v.startDateTime ? new Date(v.startDateTime).toISOString().slice(0, 19) : '';
    this.api.addSeance(this.courseId, {
      title: v.title,
      startDateTime: start,
      durationMinutes: +v.durationMinutes,
      description: v.description || undefined
    }).subscribe({
      next: (s) => { this.seances = [...this.seances, s]; this.seanceForm.reset({ durationMinutes: 60 }); this.loadSummary(); this.loadSeancesSummary(); },
      error: (err) => console.error(err)
    });
  }

  deleteSeance(s: SeanceDto) {
    if (!s.id || !confirm('Supprimer cette séance ?')) return;
    this.api.deleteSeance(this.courseId, s.id).subscribe({
      next: () => { this.seances = this.seances.filter(x => x.id !== s.id); this.loadSummary(); this.loadSeancesSummary(); }
    });
  }
}
