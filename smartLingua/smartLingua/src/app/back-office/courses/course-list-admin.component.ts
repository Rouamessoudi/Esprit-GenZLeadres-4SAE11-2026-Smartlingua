import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseApiService, CourseDto, CourseLevel, StatisticsDto, SeanceWithCourseDto, CourseSummaryDto, PageResponse } from '../../core/services/course-api.service';

@Component({
  selector: 'app-course-list-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-text">
          <h1>Gestion des cours</h1>
          <p class="header-desc">Consultez les statistiques, les prochaines séances et gérez le catalogue.</p>
        </div>
        <a routerLink="/admin/courses/new" class="btn btn-primary">
          <span class="material-icons-round">add</span>
          Nouveau cours
        </a>
      </header>

    <section class="stats-section">
      <h2 class="section-title">Statistiques</h2>
      <div class="stats-grid">
        <div class="stat-card stat-card-courses">
          <span class="material-icons-round stat-icon">school</span>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.totalCourses ?? 0 }}</span>
            <span class="stat-label">Cours</span>
          </div>
        </div>
        <div class="stat-card stat-card-resources">
          <span class="material-icons-round stat-icon">folder</span>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.totalResources ?? 0 }}</span>
            <span class="stat-label">Ressources</span>
          </div>
        </div>
        <div class="stat-card stat-card-seances">
          <span class="material-icons-round stat-icon">event</span>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.totalSeances ?? 0 }}</span>
            <span class="stat-label">Séances</span>
          </div>
        </div>
      </div>
      @if (stats?.resourcesByType) {
        <div class="stats-extra">
          <span class="stats-extra-label">Ressources par type :</span>
          <span>PDF {{ stats?.resourcesByType?.['PDF'] ?? 0 }}</span>
          <span>VIDEO {{ stats?.resourcesByType?.['VIDEO'] ?? 0 }}</span>
          <span>AUDIO {{ stats?.resourcesByType?.['AUDIO'] ?? 0 }}</span>
        </div>
      }
      @if ((stats?.upcomingSeancesTotalMinutes ?? 0) > 0) {
        <p class="stats-duration">{{ formatUpcomingDuration(stats!.upcomingSeancesTotalMinutes!) }} de séances à venir</p>
      }
    </section>

    @if (incompleteCourses.length > 0) {
      <section class="incomplete-section">
        <h2 class="section-title">Cours à finaliser</h2>
        <p class="section-desc">Cours sans ressources ou sans séances planifiées.</p>
        <ul class="incomplete-list">
          @for (c of incompleteCourses; track c.id) {
            <li>
              <a [routerLink]="['/admin/courses', c.id, 'detail']" class="incomplete-link">
                <span class="material-icons-round incomplete-icon">info</span>
                <span class="incomplete-title">{{ c.title }}</span>
                <span class="incomplete-meta">{{ c.resourceCount }} ressource(s) · {{ c.seanceCount }} séance(s)</span>
              </a>
            </li>
          }
        </ul>
      </section>
    } @else {
      <section class="incomplete-section">
        <h2 class="section-title">Cours à finaliser</h2>
        <p class="section-desc">Cours sans ressources ou sans séances planifiées. Un cours est « à finaliser » s’il n’a aucune ressource ou aucune séance.</p>
        <div class="empty-inline">
          <span class="material-icons-round">check_circle</span>
          <span>Aucun cours à finaliser. Tous les cours ont au moins une ressource et une séance.</span>
        </div>
      </section>
    }

    <section class="upcoming-section">
      <h2 class="section-title">Prochaines séances</h2>
      <p class="section-desc">Séances planifiées, tous cours confondus.</p>
      @if (upcomingSeances.length === 0) {
        <div class="empty-inline">
          <span class="material-icons-round">event_available</span>
          <span>Aucune séance à venir.</span>
        </div>
      } @else {
        <ul class="upcoming-list">
          @for (s of upcomingSeances; track s.id) {
            <li>
              <span class="material-icons-round upcoming-icon">schedule</span>
              <div class="upcoming-content">
                <strong>{{ s.title }}</strong>
                <span class="upcoming-meta">{{ s.courseTitle }} — {{ s.startDateTime | date:'short' }} ({{ s.durationMinutes }} min)</span>
              </div>
            </li>
          }
        </ul>
      }
    </section>

    <div class="table-section">
      <div class="filters">
        <label class="filter-label">Filtrer par niveau</label>
        <select (change)="onLevelChange($event)" class="filter-select">
          <option value="">Tous les niveaux</option>
          @for (lvl of levels; track lvl) {
            <option [value]="lvl" [selected]="selectedLevel === lvl">{{ lvl }}</option>
          }
        </select>
        <label class="filter-label filter-label-inline">Taille de page</label>
        <select (change)="onPageSizeChange($event)" class="filter-select filter-select-sm">
          <option [value]="5" [selected]="pageSize === 5">5</option>
          <option [value]="10" [selected]="pageSize === 10">10</option>
          <option [value]="20" [selected]="pageSize === 20">20</option>
          <option [value]="50" [selected]="pageSize === 50">50</option>
        </select>
      </div>

      @if (loading) {
        <div class="loading-inline">
          <span class="material-icons-round spin">refresh</span>
          <span>Chargement des cours…</span>
        </div>
      } @else if (error) {
        <div class="error-inline">
          <span class="material-icons-round">error_outline</span>
          <p>{{ error }}</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Titre</th>
                <th>Niveau</th>
                <th>Prix</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of courses; track c.id) {
                <tr>
                  <td class="col-id">{{ c.id }}</td>
                  <td class="col-title">{{ c.title }}</td>
                  <td><span class="badge badge-level">{{ c.level }}</span></td>
                  <td>{{ c.price ?? '—' }}</td>
                  <td>{{ c.startDate ?? '—' }}</td>
                  <td>{{ c.endDate ?? '—' }}</td>
                  <td class="col-actions">
                    <a [routerLink]="['/admin/courses', c.id, 'edit']" class="btn btn-sm btn-secondary" title="Modifier">Modifier</a>
                    <a [routerLink]="['/admin/courses', c.id, 'detail']" class="btn btn-sm btn-outline" title="Ressources et séances">Contenu</a>
                    <button type="button" class="btn btn-sm btn-danger" (click)="delete(c)" title="Supprimer">Supprimer</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (courses.length === 0) {
          <div class="empty-inline empty-table">
            <span class="material-icons-round">folder_open</span>
            <span>Aucun cours. Créez-en un avec le bouton « Nouveau cours ».</span>
          </div>
        }
        @if (totalElements > 0) {
          <div class="pagination-bar">
            <span class="pagination-info">{{ firstIndex + 1 }}-{{ lastIndex }} sur {{ totalElements }}</span>
            <div class="pagination-controls">
              <button type="button" class="btn btn-sm btn-outline" [disabled]="currentPage === 0" (click)="goToPage(0)" title="Première page">«</button>
              <button type="button" class="btn btn-sm btn-outline" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)" title="Page précédente">‹</button>
              <span class="pagination-page">Page {{ currentPage + 1 }} / {{ totalPages || 1 }}</span>
              <button type="button" class="btn btn-sm btn-outline" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)" title="Page suivante">›</button>
              <button type="button" class="btn btn-sm btn-outline" [disabled]="currentPage >= totalPages - 1" (click)="goToPage(totalPages - 1)" title="Dernière page">»</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .header-text h1 { margin: 0 0 0.25rem 0; font-size: 1.65rem; font-weight: 700; color: #1a1a2e; }
    .header-desc { margin: 0; font-size: 0.95rem; color: #636e72; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.15rem; border-radius: 8px; text-decoration: none; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: box-shadow 0.2s, background 0.2s; }
    .btn .material-icons-round { font-size: 1.1rem; }
    .btn-primary { background: #6C5CE7; color: #fff; }
    .btn-primary:hover { box-shadow: 0 4px 14px rgba(108,92,231,0.35); }
    .btn-secondary { background: #00cec9; color: #fff; }
    .btn-outline { background: #fff; border: 1px solid #e0e4ec; color: #6C5CE7; }
    .btn-outline:hover { border-color: #6C5CE7; background: rgba(108,92,231,0.06); }
    .btn-danger { background: #fff; border: 1px solid #feb2b2; color: #c53030; }
    .btn-danger:hover { background: #fff5f5; }
    .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.82rem; }
    .section-title { font-size: 1.05rem; margin: 0 0 0.35rem 0; font-weight: 700; color: #1a1a2e; }
    .section-desc { font-size: 0.88rem; color: #636e72; margin: 0 0 1rem 0; }
    .stats-section { margin-bottom: 1.75rem; }
    .stats-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #fff; border: 1px solid #e9ecef; border-radius: 12px; min-width: 160px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: box-shadow 0.2s, transform 0.2s; }
    .stat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem !important; }
    .stat-card-courses .stat-icon { background: rgba(108,92,231,0.12); color: #6C5CE7; }
    .stat-card-resources .stat-icon { background: rgba(0,206,201,0.12); color: #00cec9; }
    .stat-card-seances .stat-icon { background: rgba(0,184,148,0.12); color: #00b894; }
    .stat-content .stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: #1a1a2e; line-height: 1.2; }
    .stat-content .stat-label { font-size: 0.85rem; color: #868e96; }
    .stats-extra { margin-top: 0.75rem; font-size: 0.9rem; color: #495057; }
    .stats-extra span { margin-right: 1rem; }
    .stats-extra-label { font-weight: 600; color: #1a1a2e; }
    .stats-duration { margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #6C5CE7; font-weight: 600; }
    .incomplete-section, .upcoming-section { margin-bottom: 1.75rem; padding: 1.25rem; background: #fff; border: 1px solid #e9ecef; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .incomplete-list, .upcoming-list { list-style: none; padding: 0; margin: 0; }
    .incomplete-list li { margin-bottom: 0.5rem; }
    .incomplete-list li:last-child { margin-bottom: 0; }
    .incomplete-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.85rem; border-radius: 8px; text-decoration: none; color: #1a1a2e; transition: background 0.2s; }
    .incomplete-link:hover { background: rgba(108,92,231,0.06); }
    .incomplete-icon { font-size: 1.1rem !important; color: #6C5CE7; }
    .incomplete-title { font-weight: 600; flex: 1; }
    .incomplete-meta { font-size: 0.82rem; color: #636e72; }
    .upcoming-list li { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid #f1f3f5; }
    .upcoming-list li:last-child { border-bottom: none; }
    .upcoming-icon { font-size: 1.1rem !important; color: #00b894; flex-shrink: 0; }
    .upcoming-content { display: flex; flex-direction: column; gap: 0.15rem; }
    .upcoming-content strong { font-size: 0.9rem; }
    .upcoming-meta { font-size: 0.82rem; color: #636e72; }
    .empty-inline { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; color: #868e96; font-size: 0.9rem; }
    .empty-inline .material-icons-round { font-size: 1.25rem; color: #adb5bd; }
    .empty-table { margin-top: 1rem; }
    .table-section { margin-top: 0.5rem; }
    .filters { margin-bottom: 1rem; }
    .filter-label { display: block; font-size: 0.85rem; font-weight: 600; color: #495057; margin-bottom: 0.35rem; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #dee2e6; border-radius: 8px; font-size: 0.9rem; min-width: 160px; background: #fff; }
    .loading-inline { display: flex; align-items: center; gap: 0.5rem; padding: 1.5rem; color: #636e72; font-size: 0.9rem; }
    .loading-inline .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-inline { display: flex; align-items: flex-start; gap: 0.5rem; padding: 1rem; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; color: #c53030; }
    .error-inline .material-icons-round { font-size: 1.25rem; flex-shrink: 0; }
    .error-inline p { margin: 0; font-size: 0.9rem; }
    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .data-table { width: 100%; border-collapse: collapse; background: #fff; }
    .data-table th { text-align: left; padding: 0.85rem 1rem; font-size: 0.78rem; font-weight: 700; color: #495057; text-transform: uppercase; letter-spacing: 0.03em; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
    .data-table td { padding: 0.85rem 1rem; font-size: 0.9rem; color: #1a1a2e; border-bottom: 1px solid #f1f3f5; }
    .data-table tbody tr { transition: background 0.15s; }
    .data-table tbody tr:hover { background: rgba(108,92,231,0.03); }
    .data-table tbody tr:last-child td { border-bottom: none; }
    .col-id { font-weight: 600; color: #636e72; }
    .col-title { font-weight: 600; }
    .col-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .badge-level { background: #6C5CE7; color: #fff; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .filter-label-inline { display: inline-block; margin-left: 1rem; margin-bottom: 0; }
    .filter-select-sm { min-width: 70px; }
    .pagination-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; padding: 0.75rem 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
    .pagination-info { font-size: 0.88rem; color: #495057; }
    .pagination-controls { display: flex; align-items: center; gap: 0.35rem; }
    .pagination-page { font-size: 0.88rem; font-weight: 600; color: #1a1a2e; margin: 0 0.5rem; }
  `]
})
export class CourseListAdminComponent implements OnInit {
  courses: CourseDto[] = [];
  loading = false;
  error = '';
  selectedLevel: CourseLevel | '' = '';
  levels: CourseLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  stats: StatisticsDto | null = null;
  upcomingSeances: SeanceWithCourseDto[] = [];
  incompleteCourses: CourseSummaryDto[] = [];

  pageSize = 10;
  currentPage = 0;
  totalElements = 0;
  totalPages = 0;

  constructor(private api: CourseApiService) {}

  get firstIndex(): number {
    return this.courses.length === 0 ? 0 : this.currentPage * this.pageSize;
  }
  get lastIndex(): number {
    return Math.min(this.currentPage * this.pageSize + this.courses.length, this.totalElements);
  }

  formatUpcomingDuration(minutes: number): string {
    if (minutes < 60) return minutes + ' min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? h + ' h ' + m + ' min' : h + ' h';
  }

  ngOnInit() {
    this.load();
    this.loadStatistics();
    this.loadUpcomingSeances();
    this.loadIncompleteCourses();
  }

  loadStatistics() {
    this.api.getStatistics().subscribe({
      next: (data) => this.stats = data,
      error: () => {
        this.stats = {
          totalCourses: 0,
          totalResources: 0,
          totalSeances: 0,
          coursesByLevel: {} as Record<CourseLevel, number>,
          resourcesByType: {} as Record<string, number>,
          upcomingSeancesTotalMinutes: 0
        };
      }
    });
  }

  loadUpcomingSeances() {
    this.api.getUpcomingSeances(10).subscribe({
      next: (data) => this.upcomingSeances = Array.isArray(data) ? data : [],
      error: () => this.upcomingSeances = []
    });
  }

  loadIncompleteCourses() {
    this.api.getIncompleteCourses().subscribe({
      next: (data) => this.incompleteCourses = Array.isArray(data) ? data : [],
      error: () => this.incompleteCourses = []
    });
  }

  onLevelChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.selectedLevel = v as CourseLevel | '' || '';
    this.currentPage = 0;
    this.load();
  }

  onPageSizeChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.pageSize = parseInt(v, 10) || 10;
    this.currentPage = 0;
    this.load();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api.getCoursesPaginated(this.currentPage, this.pageSize, this.selectedLevel || undefined).subscribe({
      next: (data: PageResponse<CourseDto>) => {
        this.courses = data.content ?? [];
        this.totalElements = data.totalElements ?? 0;
        this.totalPages = data.totalPages ?? 0;
        this.loading = false;
        this.loadStatistics();
        this.loadUpcomingSeances();
        this.loadIncompleteCourses();
      },
      error: (err) => {
        const msg = this.extractHttpErrorMessage(err);
        if (err?.status === 0 || err?.status === 404) {
          this.error = 'Backend injoignable. Lancez au minimum MySQL et le microservice courses (port 8086) dans IntelliJ. Optionnel : Eureka + API Gateway (8093).';
        } else if (msg.includes('JSON') || msg.includes('SyntaxError') || err?.error instanceof ProgressEvent) {
          this.error = 'Réponse invalide du backend. Vérifiez Eureka, l\'API Gateway et le microservice courses, puis rafraîchissez cette page.';
        } else {
          this.error = msg || 'Erreur chargement';
        }
        this.loading = false;
      }
    });
  }

  delete(c: CourseDto) {
    if (!c.id || !confirm('Supprimer ce cours ?')) return;
    this.api.deleteCourse(c.id).subscribe({
      next: () => this.load(),
      error: (err) => {
        const msg = this.extractHttpErrorMessage(err);
        if (err?.status === 409 || msg.toLowerCase().includes('constraint') || msg.toLowerCase().includes('foreign key')) {
          this.error = 'Suppression impossible: ce cours contient encore des séances ou des ressources. Supprimez-les d\'abord dans "Contenu".';
          return;
        }
        this.error = msg || 'Erreur suppression du cours.';
      }
    });
  }

  private extractHttpErrorMessage(err: any): string {
    const backendError = err?.error;
    if (typeof backendError === 'string' && backendError.trim()) {
      return backendError.trim();
    }
    return backendError?.message || backendError?.error || err?.message || '';
  }
}
