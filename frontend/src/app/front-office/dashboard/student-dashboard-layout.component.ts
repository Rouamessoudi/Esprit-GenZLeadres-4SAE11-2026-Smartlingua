import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../core/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/student/dashboard">
          <span class="material-icons-round">school</span>
          <span>SmartLingua</span>
        </a>

        <nav class="menu">
          <a routerLink="/student/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="material-icons-round">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/student/courses" routerLinkActive="active">
            <span class="material-icons-round">menu_book</span>
            <span>Cours disponibles</span>
          </a>
          <a routerLink="/student/learning-path" routerLinkActive="active">
            <span class="material-icons-round">explore</span>
            <span>Mes cours</span>
          </a>
          <a routerLink="/student/adaptive/mon-niveau" routerLinkActive="active">
            <span class="material-icons-round">psychology</span>
            <span>Adaptive Learning</span>
          </a>
          <a routerLink="/student/forum" routerLinkActive="active">
            <span class="material-icons-round">forum</span>
            <span>Forum</span>
          </a>
          <a routerLink="/student/announcements" routerLinkActive="active">
            <span class="material-icons-round">campaign</span>
            <span>Annonces</span>
          </a>
          <a routerLink="/student/notifications" routerLinkActive="active">
            <span class="material-icons-round">notifications</span>
            <span>Notifications</span>
          </a>
          <a routerLink="/student/quiz" routerLinkActive="active">
            <span class="material-icons-round">quiz</span>
            <span>Quiz</span>
          </a>
          <a routerLink="/student/exams" routerLinkActive="active">
            <span class="material-icons-round">workspace_premium</span>
            <span>Exams / Certifications</span>
          </a>
          <a routerLink="/student/messaging" routerLinkActive="active">
            <span class="material-icons-round">chat</span>
            <span>Messaging</span>
          </a>
          <a routerLink="/student/rewards" routerLinkActive="active">
            <span class="material-icons-round">payments</span>
            <span>Rewards / Payment</span>
          </a>
        </nav>
      </aside>

      <section class="content-area">
        <header class="topbar">
          <div>
            <h1>Student Workspace</h1>
            <p>Welcome back, {{ username }}</p>
          </div>
          <button type="button" class="logout" (click)="logout()">
            <span class="material-icons-round">logout</span>
            Logout
          </button>
        </header>

        @if (showAdaptiveTopNav) {
          <nav class="top-nav">
            <a routerLink="/student/courses" routerLinkActive="active">Courses</a>
            <a routerLink="/student/adaptive/mon-niveau" routerLinkActive="active">Mon niveau</a>
            <a routerLink="/student/learning-path" routerLinkActive="active">Learning Path</a>
            <a routerLink="/student/progression" routerLinkActive="active">Progression</a>
            <a routerLink="/student/level-test" routerLinkActive="active">Test final</a>
          </nav>
        }

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </section>
    </div>
  `,
  styleUrl: './student-dashboard-layout.component.scss'
})
export class StudentDashboardLayoutComponent {
  username = 'Student';
  showAdaptiveTopNav = false;

  constructor(
    private keycloakService: KeycloakService,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.keycloakService.isLoggedIn()) {
      this.username = this.keycloakService.getUsername();
    }
    this.updateAdaptiveTopNav(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateAdaptiveTopNav((event as NavigationEnd).urlAfterRedirects);
      });
  }

  logout(): void {
    void this.authService.logout('/');
  }

  private updateAdaptiveTopNav(url: string): void {
    this.showAdaptiveTopNav =
      url.startsWith('/student/adaptive/') ||
      url.startsWith('/student/learning-path') ||
      url.startsWith('/student/progression') ||
      url.startsWith('/student/level-test');
  }
}
