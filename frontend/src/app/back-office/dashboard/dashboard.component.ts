import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { usersGatewayPrefix } from '../../core/api-gateway-urls';

type AdminDashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalUsers: number;
  activeCourses: number;
  quizzesTaken: number;
  enrollments: number;
};

type EnrollmentByMonth = { month: string; count: number };
type DashboardCourse = { id?: number; title: string; level?: string; resources?: unknown[]; seances?: unknown[] };

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe, DatePipe, RouterLink],
    template: `
    <div class="dashboard">
      <div class="dashboard-header animate-fade-in-up">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, Admin! Here's what's happening with SmartLingua today.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm">
            <span class="material-icons-round">download</span>
            Export
          </button>
          <a routerLink="/admin/courses/new" class="btn btn-primary btn-sm">
            <span class="material-icons-round">add</span>
            New Course
          </a>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid animate-fade-in-up">
        @for (stat of stats; track stat.label; let i = $index) {
          <div class="stat-card" [style.animation-delay]="(i * 0.08) + 's'">
            <div class="stat-icon" [style.background]="stat.iconBg">
              <span class="material-icons-round" [style.color]="stat.iconColor">{{ stat.icon }}</span>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            <div class="stat-trend" [class.up]="stat.trendUp" [class.down]="!stat.trendUp">
              <span class="material-icons-round">{{ stat.trendUp ? 'trending_up' : 'trending_down' }}</span>
              <span>{{ stat.trend }}</span>
            </div>
          </div>
        }
      </div>

      <div class="dashboard-grid">
        <!-- Chart Section -->
        <div class="chart-card card animate-fade-in-up">
          <div class="card-top">
            <h3>Enrollment Overview</h3>
            <div class="chart-tabs">
              @for (tab of chartTabs; track tab) {
                <button class="chart-tab" [class.active]="activeChartTab === tab" (click)="activeChartTab = tab">{{ tab }}</button>
              }
            </div>
          </div>
          <div class="chart-body">
            <div class="bar-chart">
              @for (bar of chartData; track bar.month) {
                <div class="bar-group">
                  <div class="bar-wrapper">
                    <div class="bar" [style.height]="bar.value + '%'" [title]="bar.count + ' enrollments'">
                      <span class="bar-tooltip">{{ bar.count }}</span>
                    </div>
                  </div>
                  <span class="bar-label">{{ bar.month }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Course Performance / Vos cours -->
        <div class="performance-card card animate-fade-in-up" style="animation-delay: 0.15s">
          <div class="card-top">
            <h3>Vos cours</h3>
            <a routerLink="/admin/courses" class="btn btn-secondary btn-sm">Voir tout</a>
          </div>
          <div class="performance-list">
            @if (coursesLoading) {
              <p class="perf-empty">Chargement...</p>
            } @else if (dashboardCourses.length === 0) {
              <p class="perf-empty">Aucun cours. <a routerLink="/admin/courses/new">Créer un cours</a></p>
            } @else {
              @for (course of dashboardCourses; track course.id) {
                <a [routerLink]="['/admin/courses', course.id, 'detail']" class="performance-item performance-item-link">
                  <div class="perf-icon" [style.background]="course.color">
                    <span class="material-icons-round">{{ course.icon }}</span>
                  </div>
                  <div class="perf-info">
                    <strong>{{ course.title }}</strong>
                    <span>Niveau {{ course.level }} · {{ course.resourceCount }} ressource(s) · {{ course.seanceCount }} séance(s)</span>
                  </div>
                  <span class="material-icons-round perf-arrow">chevron_right</span>
                </a>
              }
            }
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-card card animate-fade-in-up" style="animation-delay: 0.2s">
          <div class="card-top">
            <h3>Upcoming Sessions</h3>
          </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Course</th>
                  <th>Session</th>
                  <th>Start</th>
                  <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              @if (upcomingSeances.length === 0) {
                <tr>
                  <td colspan="4">No upcoming session found.</td>
                </tr>
              } @else {
                @for (session of upcomingSeances; track session.id) {
                  <tr>
                    <td>{{ session.courseTitle }}</td>
                    <td>{{ session.title }}</td>
                    <td>{{ session.startDateTime | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ session.durationMinutes }} min</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    activeChartTab = 'Monthly';
    chartTabs = ['Weekly', 'Monthly', 'Yearly'];
    coursesLoading = true;
    dashboardCourses: { id: number; title: string; level: string; resourceCount: number; seanceCount: number; icon: string; color: string }[] = [];
    upcomingSeances: Array<{ id?: number; courseTitle?: string; title?: string; startDateTime?: string; durationMinutes?: number }> = [];

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
      forkJoin({
        stats: this.http.get<AdminDashboardStats>(`${usersGatewayPrefix()}/api/admin/dashboard/stats`).pipe(
          catchError(() => of({
            totalStudents: 0,
            totalTeachers: 0,
            totalUsers: 0,
            activeCourses: 0,
            quizzesTaken: 0,
            enrollments: 0
          }))
        ),
        enrollmentsByMonth: this.http.get<EnrollmentByMonth[]>(`${usersGatewayPrefix()}/api/admin/dashboard/enrollments-by-month`).pipe(
          catchError(() => of([]))
        ),
        courses: this.http.get<DashboardCourse[]>(`${usersGatewayPrefix()}/api/admin/dashboard/courses`).pipe(
          catchError(() => of([]))
        )
      }).subscribe({
        next: ({ stats, enrollmentsByMonth, courses }) => {
          this.dashboardCourses = (courses ?? []).map((c) => ({
            id: c.id ?? 0,
            title: c.title ?? 'Untitled course',
            level: c.level ?? 'A1',
            resourceCount: Array.isArray(c.resources) ? c.resources.length : 0,
            seanceCount: Array.isArray(c.seances) ? c.seances.length : 0,
            icon: this.getIconForLevel(c.level),
            color: this.getColorForLevel(c.level)
          }));

          this.stats = [
            { icon: 'people', label: 'Total Students', value: this.formatNumber(stats.totalStudents ?? 0), trend: 'Live', trendUp: true, iconBg: 'rgba(108,92,231,0.12)', iconColor: '#6C5CE7' },
            { icon: 'school', label: 'Active Courses', value: this.formatNumber(stats.activeCourses ?? 0), trend: 'Live', trendUp: true, iconBg: 'rgba(0,206,201,0.12)', iconColor: '#00cec9' },
            { icon: 'quiz', label: 'Quizzes Taken', value: this.formatNumber(stats.quizzesTaken ?? 0), trend: 'Live', trendUp: true, iconBg: 'rgba(0,184,148,0.12)', iconColor: '#00b894' },
            { icon: 'assignment', label: 'Enrollments', value: this.formatNumber(stats.enrollments ?? 0), trend: 'Live', trendUp: true, iconBg: 'rgba(225,112,85,0.12)', iconColor: '#e17055' },
          ];

          const monthly = (enrollmentsByMonth ?? []).slice(-12);
          const labels = monthly.map((m) => this.formatMonth(m.month));
          const counts = monthly.map((m) => m.count ?? 0);
          const max = Math.max(...counts, 1);
          this.chartData = labels.map((label, i) => ({
            month: label,
            value: Math.max(8, Math.round((counts[i] / max) * 100)),
            count: counts[i]
          }));
          if (this.chartData.length === 0) {
            this.chartData = [{ month: '-', value: 8, count: 0 }];
          }
          this.coursesLoading = false;
        },
        error: () => {
          this.coursesLoading = false;
        }
      });
    }

    private getIconForLevel(level?: string): string {
      if (!level) return 'school';
      if (['A1', 'A2'].includes(level)) return 'auto_stories';
      if (['B1', 'B2'].includes(level)) return 'forum';
      return 'emoji_events';
    }

    private getColorForLevel(level?: string): string {
      if (!level) return 'linear-gradient(135deg, #6C5CE7, #a29bfe)';
      if (['A1', 'A2'].includes(level)) return 'linear-gradient(135deg, #00b894, #00cec9)';
      if (['B1', 'B2'].includes(level)) return 'linear-gradient(135deg, #6C5CE7, #a29bfe)';
      return 'linear-gradient(135deg, #fdcb6e, #e17055)';
    }

    stats = [
        { icon: 'people', label: 'Total Students', value: '0', trend: 'Live', trendUp: true, iconBg: 'rgba(108,92,231,0.12)', iconColor: '#6C5CE7' },
        { icon: 'school', label: 'Active Courses', value: '0', trend: 'Live', trendUp: true, iconBg: 'rgba(0,206,201,0.12)', iconColor: '#00cec9' },
        { icon: 'quiz', label: 'Quizzes Taken', value: '0', trend: 'Live', trendUp: true, iconBg: 'rgba(0,184,148,0.12)', iconColor: '#00b894' },
        { icon: 'assignment', label: 'Enrollments', value: '0', trend: 'Live', trendUp: true, iconBg: 'rgba(225,112,85,0.12)', iconColor: '#e17055' },
    ];

    chartData = [
        { month: '-', value: 8, count: 0 },
    ];

    private formatNumber(value: number): string {
      return new Intl.NumberFormat('en-US').format(Math.max(0, value || 0));
    }

    private formatMonth(month: string): string {
      const value = (month || '').trim();
      if (!value) {
        return '-';
      }
      if (/^\d{4}-\d{2}$/.test(value)) {
        return value.slice(5);
      }
      return value;
    }
}
