import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCardComponent, Course } from '../course-card/course-card.component';
import { FormsModule } from '@angular/forms';
import { CourseApiService, CourseDto, CourseLevel, SeanceWithCourseDto } from '../../../core/services/course-api.service';
import { KeycloakService } from 'keycloak-angular';

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
              <button class="chip" [class.active]="activeLevel === level" (click)="filterByLevel(level)">
                {{ level }}
              </button>
            }
          </div>
        </div>

        @if (loading) {
          <p class="loading-msg">Chargement des cours...</p>
        } @else if (error) {
          <p class="error-msg">Impossible de charger les cours. Vérifiez que le backend (microservice courses) est démarré.</p>
        } @else if (filteredCourses.length === 0) {
          <p class="empty-msg">Aucun cours pour le moment.</p>
        } @else {
          <div class="courses-grid">
            @for (course of pagedCourses; track course.id; let i = $index) {
              <div class="animate-fade-in-up" [style.animation-delay]="(i * 0.1) + 's'">
                <app-course-card [course]="course" (enroll)="onEnroll($event)"></app-course-card>
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

    pageSize = 6;
    currentPage = 0;

    constructor(
      private courseApi: CourseApiService,
      private keycloak: KeycloakService
    ) {}

    get isAdmin(): boolean {
      return this.keycloak.getUserRoles().includes('admin');
    }

    ngOnInit(): void {
      this.courseApi.getCourses().subscribe({
        next: (dtos) => {
          this.courses = dtos.map(dto => this.mapToCourse(dto));
          this.loadUpcomingSeances();
          this.loading = false;
          this.error = false;
        },
        error: () => {
          this.loading = false;
          this.error = true;
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
      return {
        id: dto.id ?? 0,
        title: dto.title,
        description: dto.description ?? '',
        level: levelLabel,
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

    onEnroll(course: Course) {
        console.log('Enroll:', course.title);
    }
}
