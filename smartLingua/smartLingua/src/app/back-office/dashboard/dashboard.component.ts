import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [DecimalPipe],
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
          <button class="btn btn-primary btn-sm">
            <span class="material-icons-round">add</span>
            New Course
          </button>
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

        <!-- Course Performance -->
        <div class="performance-card card animate-fade-in-up" style="animation-delay: 0.15s">
          <div class="card-top">
            <h3>Course Performance</h3>
            <button class="icon-btn">
              <span class="material-icons-round">more_vert</span>
            </button>
          </div>
          <div class="performance-list">
            @for (course of topCourses; track course.name) {
              <div class="performance-item">
                <div class="perf-icon" [style.background]="course.color">
                  <span class="material-icons-round">{{ course.icon }}</span>
                </div>
                <div class="perf-info">
                  <strong>{{ course.name }}</strong>
                  <span>{{ course.students | number }} students</span>
                </div>
                <div class="perf-progress">
                  <div class="perf-bar-bg">
                    <div class="perf-bar" [style.width]="course.completion + '%'" [style.background]="course.barColor"></div>
                  </div>
                  <span class="perf-percent">{{ course.completion }}%</span>
                </div>
              </div>
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
export class DashboardComponent {
    activeChartTab = 'Monthly';
    chartTabs = ['Weekly', 'Monthly', 'Yearly'];

    stats = [
        { icon: 'people', label: 'Total Students', value: '12,458', trend: '+12.5%', trendUp: true, iconBg: 'rgba(108,92,231,0.12)', iconColor: '#6C5CE7' },
        { icon: 'school', label: 'Active Courses', value: '48', trend: '+3.2%', trendUp: true, iconBg: 'rgba(0,206,201,0.12)', iconColor: '#00cec9' },
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

    topCourses = [
        { name: 'English Foundations', students: 4520, completion: 85, icon: 'auto_stories', color: 'linear-gradient(135deg, #00b894, #00cec9)', barColor: '#00b894' },
        { name: 'Business English', students: 3210, completion: 72, icon: 'business_center', color: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', barColor: '#6C5CE7' },
        { name: 'IELTS Preparation', students: 2890, completion: 68, icon: 'emoji_events', color: 'linear-gradient(135deg, #fdcb6e, #e17055)', barColor: '#e17055' },
        { name: 'Conversational English', students: 2340, completion: 91, icon: 'forum', color: 'linear-gradient(135deg, #0984e3, #74b9ff)', barColor: '#0984e3' },
        { name: 'Grammar Mastery', students: 1870, completion: 64, icon: 'spellcheck', color: 'linear-gradient(135deg, #00cec9, #81ecec)', barColor: '#00cec9' },
    ];

    recentActivity = [
        { student: 'Sarah Johnson', email: 'sarah.j@email.com', initials: 'SJ', avatarColor: '#6C5CE7', action: 'Enrolled', course: 'Business English', date: 'Feb 11, 2026', status: 'active' },
        { student: 'Mike Chen', email: 'mike.c@email.com', initials: 'MC', avatarColor: '#00cec9', action: 'Completed Quiz', course: 'Grammar Mastery', date: 'Feb 11, 2026', status: 'completed' },
        { student: 'Emily Davis', email: 'emily.d@email.com', initials: 'ED', avatarColor: '#e17055', action: 'Started Course', course: 'IELTS Preparation', date: 'Feb 10, 2026', status: 'active' },
        { student: 'Alex Kim', email: 'alex.k@email.com', initials: 'AK', avatarColor: '#00b894', action: 'Submitted Assignment', course: 'English Foundations', date: 'Feb 10, 2026', status: 'pending' },
        { student: 'Lisa Wang', email: 'lisa.w@email.com', initials: 'LW', avatarColor: '#fdcb6e', action: 'Enrolled', course: 'Conversational English', date: 'Feb 9, 2026', status: 'active' },
    ];
}
