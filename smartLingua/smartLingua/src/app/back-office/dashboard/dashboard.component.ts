import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseApiService } from '../../core/services/course-api.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink],
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
              <span class="stat-value">{{ stat.label === 'Active Courses' ? dashboardCourses.length : stat.value }}</span>
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
          <h3>Recent Activity</h3>
          <button class="btn btn-secondary btn-sm">View All</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Action</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (activity of recentActivity; track activity.student) {
                <tr>
                  <td>
                    <div class="student-cell">
                      <div class="student-avatar" [style.background]="activity.avatarColor">
                        {{ activity.initials }}
                      </div>
                      <div>
                        <strong>{{ activity.student }}</strong>
                        <small>{{ activity.email }}</small>
                      </div>
                    </div>
                  </td>
                  <td>{{ activity.action }}</td>
                  <td>{{ activity.course }}</td>
                  <td>{{ activity.date }}</td>
                  <td>
                    <span class="status-badge" [class]="'status-' + activity.status">
                      {{ activity.status }}
                    </span>
                  </td>
                </tr>
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

    constructor(private courseApi: CourseApiService) {}

    ngOnInit(): void {
      this.courseApi.getCourses().subscribe({
        next: (courses) => {
          this.dashboardCourses = courses.map(c => ({
            id: c.id ?? 0,
            title: c.title,
            level: c.level ?? 'A1',
            resourceCount: c.resources?.length ?? 0,
            seanceCount: c.seances?.length ?? 0,
            icon: this.getIconForLevel(c.level),
            color: this.getColorForLevel(c.level)
          }));
          this.coursesLoading = false;
        },
        error: () => { this.coursesLoading = false; }
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
        { icon: 'people', label: 'Total Students', value: '12,458', trend: '+12.5%', trendUp: true, iconBg: 'rgba(108,92,231,0.12)', iconColor: '#6C5CE7' },
        { icon: 'school', label: 'Active Courses', value: '0', trend: '+3.2%', trendUp: true, iconBg: 'rgba(0,206,201,0.12)', iconColor: '#00cec9' },
        { icon: 'quiz', label: 'Quizzes Taken', value: '8,392', trend: '+18.7%', trendUp: true, iconBg: 'rgba(0,184,148,0.12)', iconColor: '#00b894' },
        { icon: 'assignment', label: 'Enrollments', value: '2,847', trend: '-2.1%', trendUp: false, iconBg: 'rgba(225,112,85,0.12)', iconColor: '#e17055' },
    ];

    chartData = [
        { month: 'Jan', value: 45, count: 180 },
        { month: 'Feb', value: 60, count: 240 },
        { month: 'Mar', value: 55, count: 218 },
        { month: 'Apr', value: 75, count: 302 },
        { month: 'May', value: 65, count: 260 },
        { month: 'Jun', value: 80, count: 320 },
        { month: 'Jul', value: 70, count: 280 },
        { month: 'Aug', value: 90, count: 362 },
        { month: 'Sep', value: 85, count: 340 },
        { month: 'Oct', value: 95, count: 380 },
        { month: 'Nov', value: 78, count: 312 },
        { month: 'Dec', value: 88, count: 350 },
    ];

    recentActivity = [
        { student: 'Sarah Johnson', email: 'sarah.j@email.com', initials: 'SJ', avatarColor: '#6C5CE7', action: 'Enrolled', course: 'Business English', date: 'Feb 11, 2026', status: 'active' },
        { student: 'Mike Chen', email: 'mike.c@email.com', initials: 'MC', avatarColor: '#00cec9', action: 'Completed Quiz', course: 'Grammar Mastery', date: 'Feb 11, 2026', status: 'completed' },
        { student: 'Emily Davis', email: 'emily.d@email.com', initials: 'ED', avatarColor: '#e17055', action: 'Started Course', course: 'IELTS Preparation', date: 'Feb 10, 2026', status: 'active' },
        { student: 'Alex Kim', email: 'alex.k@email.com', initials: 'AK', avatarColor: '#00b894', action: 'Submitted Assignment', course: 'English Foundations', date: 'Feb 10, 2026', status: 'pending' },
        { student: 'Lisa Wang', email: 'lisa.w@email.com', initials: 'LW', avatarColor: '#fdcb6e', action: 'Enrolled', course: 'Conversational English', date: 'Feb 9, 2026', status: 'active' },
    ];
}
