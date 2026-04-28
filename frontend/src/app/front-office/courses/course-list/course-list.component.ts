import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CourseCardComponent, Course } from '../course-card/course-card.component';
import { FormsModule } from '@angular/forms';
import { CourseApiService, CourseDto, CourseLevel, ResourceDto, SeanceWithCourseDto } from '../../../core/services/course-api.service';
import { AdaptiveApiService, CourseCoachInsightDto } from '../../../core/services/adaptive-api.service';
import { AdaptiveModuleService } from '../../../core/services/adaptive-module.service';
import { KeycloakService } from 'keycloak-angular';
import { canAccessCourseByCefr } from '../../../core/cefr-levels';
import { UserSyncService } from '../../../core/user-sync.service';
import { AuthService } from '../../../core/auth.service';
import { readApiErrorMessage } from '../../../core/http-error.util';

/** Niveaux API (A1–C2) vers libellés affichés */
const LEVEL_TO_LABEL: Record<CourseLevel, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  A1: 'Beginner', A2: 'Beginner',
  B1: 'Intermediate', B2: 'Intermediate',
  C1: 'Advanced', C2: 'Advanced'
};

const LEVEL_ICON: Record<string, string> = {
  Beginner: 'auto_stories',
  Intermediate: 'forum',
  Advanced: 'emoji_events'
};

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
  Intermediate: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
  Advanced: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)'
};

/** Ordre d'affichage des niveaux (étudiant : du plus facile au plus avancé) */
const LEVEL_ORDER: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CourseCardComponent, FormsModule, RouterLink],
    template: `
    <section class="courses-page">
      @if (coachModalOpen) {
        <div class="coach-overlay" (click)="closeCoach()" role="presentation"></div>
        <div class="coach-panel" role="dialog" aria-labelledby="coach-dialog-title">
          <div class="coach-panel-head">
            <h2 id="coach-dialog-title">
              <span class="material-icons-round coach-spark">auto_awesome</span>
              Conseil du coach IA
            </h2>
            <button type="button" class="coach-close" (click)="closeCoach()" aria-label="Fermer">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          @if (coachLoading) {
            <div class="coach-loading">
              <span class="material-icons-round spin">refresh</span>
              <p>Analyse de votre profil et du cours…</p>
            </div>
          } @else if (coachError) {
            <p class="coach-error">{{ coachError }}</p>
            <a routerLink="/learning-profile" class="btn-profile-link" (click)="closeCoach()">Ouvrir le profil apprenant</a>
          } @else if (coachResult) {
            <p class="coach-course-name">{{ coachResult.courseTitle }}</p>
            <div class="coach-insight">{{ coachResult.insight }}</div>
            <p class="coach-hint">Basé sur votre profil enregistré et le catalogue cours (inter-service). Sans clé OpenAI, un texte de secours est utilisé.</p>
          }
        </div>
      }
      @if (resourcesModalOpen) {
        <div class="coach-overlay" (click)="closeResources()" role="presentation"></div>
        <div class="coach-panel" role="dialog" aria-labelledby="resources-dialog-title">
          <div class="coach-panel-head">
            <h2 id="resources-dialog-title">
              <span class="material-icons-round coach-spark">subscriptions</span>
              Videos & Podcasts - {{ resourcesCourseTitle }}
            </h2>
            <button type="button" class="coach-close" (click)="closeResources()" aria-label="Fermer">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          @if (resourcesLoading) {
            <div class="coach-loading">
              <span class="material-icons-round spin">refresh</span>
              <p>Chargement des ressources...</p>
            </div>
          } @else if (resourcesError) {
            <p class="coach-error">{{ resourcesError }}</p>
          } @else {
            <div class="resources-block">
              <h3 class="resources-title">Videos</h3>
              @if (resourceVideos.length === 0) {
                <p class="resources-empty">Aucune video pour ce cours.</p>
              } @else {
                <ul class="resources-list">
                  @for (r of resourceVideos; track r.id) {
                    <li>
                      <span class="material-icons-round">videocam</span>
                      <a [href]="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
                    </li>
                  }
                </ul>
              }
              <h3 class="resources-title">Podcasts</h3>
              @if (resourcePodcasts.length === 0) {
                <p class="resources-empty">Aucun podcast pour ce cours.</p>
              } @else {
                <ul class="resources-list">
                  @for (r of resourcePodcasts; track r.id) {
                    <li>
                      <span class="material-icons-round">podcasts</span>
                      <a [href]="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
                    </li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      }

      <div class="container">
        <div class="page-header animate-fade-in-up">
          <h1>Explore Our Courses</h1>
          <p>Discover expert-crafted English courses designed to take you from beginner to fluent speaker.</p>
        </div>

        @if (isAdmin) {
          <div class="admin-shortcut animate-fade-in-up">
            <span class="material-icons-round">admin_panel_settings</span>
            <div class="admin-shortcut-text">
              <strong>Vous êtes administrateur.</strong> Pour ajouter ou modifier des cours, ressources et séances :
            </div>
            <a routerLink="/admin/courses" class="btn btn-primary">
              <span class="material-icons-round">add</span>
              Gérer et ajouter des cours
            </a>
          </div>
        }

        <div class="filters animate-fade-in-up">
          <div class="search-box">
            <span class="material-icons-round">search</span>
            <input type="text" placeholder="Search courses..." [(ngModel)]="searchTerm">
          </div>
          <div class="filter-chips">
            @for (level of levels; track level) {
              <button type="button" class="chip" [class.active]="activeLevel === level" (click)="filterByLevel(level)">
                {{ level }}
              </button>
            }
          </div>
        </div>

        @if (loading) {
          <p class="loading-msg">Chargement des cours...</p>
        } @else if (error) {
          <p class="error-msg">{{ coursesErrorMsg }}</p>
        } @else if (enrollErrorMsg) {
          <p class="error-msg">{{ enrollErrorMsg }}</p>
        } @else if (filteredCourses.length === 0) {
          <p class="empty-msg">Aucun cours pour le moment.</p>
        } @else {
          @if (catalogHintMsg) {
            <p class="catalog-hint">{{ catalogHintMsg }}</p>
          }
          <div class="courses-grid">
            @for (course of pagedCourses; track course.id; let i = $index) {
              <div class="animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
                <app-course-card
                  [course]="course"
                  (enroll)="onEnroll($event)"
                  (coachAi)="onCoachAi($event)"
                  (resources)="onOpenResources($event)"
                ></app-course-card>
              </div>
            }
          </div>
          @if (totalPages > 1) {
            <div class="pagination-bar">
              <span class="pagination-info">Page {{ currentPage + 1 }} / {{ totalPages }} ({{ totalElements }} cours)</span>
              <div class="pagination-controls">
                <button type="button" class="btn-pag" [disabled]="currentPage === 0" (click)="prevPage()">‹ Précédent</button>
                <button type="button" class="btn-pag" [disabled]="currentPage >= totalPages - 1" (click)="nextPage()">Suivant ›</button>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
    styleUrl: './course-list.component.scss'
})
export class CourseListComponent implements OnInit {
    searchTerm = '';
    activeLevel = 'All';
    levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

    courses: Course[] = [];
    loading = true;
    error = false;
    coursesErrorMsg =
        'Impossible de charger les cours. Démarrez Eureka, la gateway (8093) et le microservice courses (8086), ou seulement courses (8086) pour un repli direct. Redémarrez `ng serve` après toute modification de proxy.conf.json.';
    /** Message informatif (pas une erreur) sous les filtres. */
    catalogHintMsg: string | null = null;
    /** Erreur d'inscription adaptive (au lieu de redirection silencieuse). */
    enrollErrorMsg: string | null = null;
    /** Niveau CECRL de l’apprenant (profil adaptatif), pour le verrou par cours. */
    private studentCefrLevel: CourseLevel | null = null;

    pageSize = 6;
    currentPage = 0;

    coachModalOpen = false;
    coachLoading = false;
    coachError: string | null = null;
    coachResult: CourseCoachInsightDto | null = null;
    resourcesModalOpen = false;
    resourcesLoading = false;
    resourcesError: string | null = null;
    resourcesCourseTitle = '';
    resourceVideos: ResourceDto[] = [];
    resourcePodcasts: ResourceDto[] = [];

    constructor(
      private courseApi: CourseApiService,
      private adaptiveApi: AdaptiveApiService,
      private adaptiveModule: AdaptiveModuleService,
      private keycloak: KeycloakService,
      private authService: AuthService,
      private userSync: UserSyncService,
      private router: Router
    ) {}

    get isAdmin(): boolean {
      return this.authService.isAdmin();
    }

    ngOnInit(): void {
      void this.bootstrapCourses();
    }

    private async bootstrapCourses(): Promise<void> {
      if (this.isAdmin) {
        this.studentCefrLevel = null;
        this.catalogHintMsg = null;
        this.loadFullCatalog();
        return;
      }

      if (this.keycloak.isLoggedIn()) {
        this.catalogHintMsg =
          'Tous les cours sont listés. L’inscription et les actions (vidéos, coach, inscription) ne sont possibles que pour les cours de votre niveau CECRL ou un niveau inférieur.';
        this.adaptiveModule.getProfileMe().subscribe({
          next: (p) => {
            this.studentCefrLevel = p.currentLevel;
            this.loadFullCatalog();
          },
          error: () => {
            this.studentCefrLevel = null;
            this.catalogHintMsg =
              'Tous les cours sont visibles. Sans profil adaptatif (Mon niveau), seuls les cours A1 sont débloqués pour l’accès — passez le test de placement pour ajuster.';
            this.loadFullCatalog();
          }
        });
        return;
      }

      this.studentCefrLevel = null;
      this.catalogHintMsg = null;
      this.loadFullCatalog();
    }

    private loadFullCatalog(): void {
      this.courseApi.getCourses().subscribe({
        next: (dtos) => {
          this.courses = dtos.map((dto) => this.mapToCourseWithAccess(dto));
          this.loadUpcomingSeances();
          this.loading = false;
          this.error = false;
        },
        error: (e: { status?: number; message?: string; url?: string }) => {
          this.loading = false;
          this.error = true;
          const hint =
            e?.status === 0
              ? ' (réseau / CORS / serveur arrêté — ouvrez F12 → Réseau pour voir la requête vers /api-proxy/courses ou :8086)'
              : e?.status != null
                ? ` (HTTP ${e.status})`
                : '';
          this.coursesErrorMsg =
            'Impossible de charger les cours.' +
            hint +
            ' Vérifiez : Eureka + gateway 8093 + courses 8086, ou au minimum courses sur 8086. Redémarrez `ng serve` si vous avez changé le proxy.';
        }
      });
    }

    private loadUpcomingSeances(): void {
      this.courseApi.getUpcomingSeances(50).subscribe({
        next: (seances) => {
          this.attachSeancesToCourses(seances);
        },
        error: () => { /* ignore: les cours s'affichent sans séances */ }
      });
    }

    private attachSeancesToCourses(seances: SeanceWithCourseDto[]): void {
      this.courses = this.courses.map(c => {
        const forCourse = seances.filter(s => s.courseId === c.id).map(s => this.formatSeance(s));
        return forCourse.length ? { ...c, upcomingSeances: forCourse } : c;
      });
    }

    private formatSeance(s: SeanceWithCourseDto): { title: string; date: string; time: string; durationMinutes: number } {
      const d = new Date(s.startDateTime);
      const date = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return { title: s.title, date, time, durationMinutes: s.durationMinutes };
    }

    private mapToCourseWithAccess(dto: CourseDto): Course {
      const base = this.mapToCourse(dto);
      const cefr = dto.level ?? 'A1';
      if (this.isAdmin || !this.keycloak.isLoggedIn()) {
        return { ...base, cefrLevel: cefr, accessAllowed: true };
      }
      return {
        ...base,
        cefrLevel: cefr,
        accessAllowed: canAccessCourseByCefr(this.studentCefrLevel, cefr)
      };
    }

    private mapToCourse(dto: CourseDto): Course {
      const levelLabel = LEVEL_TO_LABEL[dto.level ?? 'A1'];
      const lessons = (dto.resources?.length ?? 0) + (dto.seances?.length ?? 0) || 1;
      let duration = '—';
      if (dto.startDate && dto.endDate) {
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        const weeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
        duration = `${weeks} semaine(s)`;
      }
      const cefr = dto.level ?? 'A1';
      return {
        id: dto.id ?? 0,
        title: dto.title,
        description: dto.description ?? '',
        level: levelLabel,
        cefrLevel: cefr,
        accessAllowed: true,
        lessons,
        duration,
        students: 0,
        rating: 0,
        icon: LEVEL_ICON[levelLabel] ?? 'school',
        color: LEVEL_COLOR[levelLabel] ?? 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)'
      };
    }

    get filteredCourses(): Course[] {
        const filtered = this.courses.filter(c => {
            const matchesLevel = this.activeLevel === 'All' || c.level === this.activeLevel;
            const matchesSearch = !this.searchTerm || c.title.toLowerCase().includes(this.searchTerm.toLowerCase());
            return matchesLevel && matchesSearch;
        });
        // Ordre par niveau : Beginner puis Intermediate puis Advanced
        return filtered.sort((a, b) => (LEVEL_ORDER[a.level] ?? 0) - (LEVEL_ORDER[b.level] ?? 0));
    }

    get pagedCourses(): Course[] {
        const list = this.filteredCourses;
        const start = this.currentPage * this.pageSize;
        return list.slice(start, start + this.pageSize);
    }

    get totalElements(): number {
        return this.filteredCourses.length;
    }

    get totalPages(): number {
        const n = this.totalElements;
        return n === 0 ? 0 : Math.ceil(n / this.pageSize);
    }

    prevPage(): void {
        if (this.currentPage > 0) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages - 1) this.currentPage++;
    }

    filterByLevel(level: string) {
        this.activeLevel = level;
        this.currentPage = 0;
    }

    onEnroll(course: Course): void {
        this.enrollErrorMsg = null;
        if (!course.accessAllowed) {
          return;
        }
        this.adaptiveModule.enrollInCourseMe(course.id).subscribe({
          next: () => {
            void this.router.navigate(['/learning-path'], {
              queryParams: {
                enrollCourseId: course.id,
                enrollCourseTitle: course.title,
                enrollCourseCefr: course.cefrLevel
              }
            });
          },
          error: (e) => {
            this.enrollErrorMsg = readApiErrorMessage(
              e,
              "Inscription impossible pour ce compte. Passe d'abord le test de placement sur 'Mon niveau', puis réessaie."
            );
          }
        });
    }

    onCoachAi(course: Course): void {
        if (!course.accessAllowed) {
          return;
        }
        this.coachModalOpen = true;
        this.coachLoading = true;
        this.coachError = null;
        this.coachResult = null;
        void this.userSync.resolveStudentId().then((sid) => {
            if (sid == null) {
                this.coachLoading = false;
                this.coachError =
                    'Connectez-vous pour obtenir un conseil personnalisé ; votre compte est reconnu automatiquement (aucun identifiant à saisir). Enregistrez aussi votre profil sur la page Profil apprenant.';
                return;
            }
            this.adaptiveApi.getCourseCoachInsight(sid, course.id).subscribe({
            next: (r) => {
                this.coachResult = r;
                this.coachLoading = false;
            },
            error: (e: { error?: { message?: string }; message?: string; status?: number }) => {
                this.coachLoading = false;
                const msg =
                    (typeof e?.error === 'object' && e.error?.message) ||
                    (typeof e?.error === 'string' ? e.error : null) ||
                    e?.message;
                this.coachError =
                    msg ??
                    'Impossible d’obtenir le conseil. Vérifiez la gateway (8093), adaptive-learning (8094), courses, Eureka, et que votre profil existe.';
            }
        });
        });
    }

    closeCoach(): void {
        this.coachModalOpen = false;
        this.coachError = null;
        this.coachResult = null;
    }

    onOpenResources(course: Course): void {
        if (!course.accessAllowed) {
          return;
        }
        this.resourcesModalOpen = true;
        this.resourcesLoading = true;
        this.resourcesError = null;
        this.resourcesCourseTitle = course.title;
        this.resourceVideos = [];
        this.resourcePodcasts = [];
        this.courseApi.getResources(course.id).subscribe({
            next: (resources) => {
                this.resourceVideos = resources.filter((r) => r.type === 'VIDEO');
                this.resourcePodcasts = resources.filter((r) => r.type === 'AUDIO');
                this.resourcesLoading = false;
            },
            error: () => {
                this.resourcesLoading = false;
                this.resourcesError = 'Impossible de charger les ressources pour ce cours.';
            }
        });
    }

    closeResources(): void {
        this.resourcesModalOpen = false;
        this.resourcesLoading = false;
        this.resourcesError = null;
        this.resourcesCourseTitle = '';
        this.resourceVideos = [];
        this.resourcePodcasts = [];
    }
}
