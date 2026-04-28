import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-teacher-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/teacher/dashboard">
          <span class="material-icons-round">school</span>
          <span>SmartLingua</span>
        </a>

        <nav class="menu">
          <a routerLink="/teacher/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <span class="material-icons-round">dashboard</span>
            <span>Teacher Dashboard</span>
          </a>
          <a routerLink="/teacher/courses" routerLinkActive="active">
            <span class="material-icons-round">menu_book</span>
            <span>Mes cours</span>
          </a>
          <a routerLink="/teacher/courses/new" routerLinkActive="active">
            <span class="material-icons-round">add_circle</span>
            <span>Ajouter cours</span>
          </a>
          <a routerLink="/teacher/students" routerLinkActive="active">
            <span class="material-icons-round">group</span>
            <span>Mes etudiants</span>
          </a>
          <a routerLink="/teacher/messaging" routerLinkActive="active">
            <span class="material-icons-round">chat</span>
            <span>Messaging</span>
          </a>
          <a routerLink="/teacher/forum" routerLinkActive="active">
            <span class="material-icons-round">forum</span>
            <span>Forum</span>
          </a>
          <a routerLink="/teacher/announcements" routerLinkActive="active">
            <span class="material-icons-round">campaign</span>
            <span>Annonces</span>
          </a>
          <a routerLink="/teacher/notifications" routerLinkActive="active">
            <span class="material-icons-round">notifications</span>
            <span>Notifications</span>
          </a>
        </nav>
      </aside>

      <section class="content-area">
        <header class="topbar">
          <div>
            <h1>Teacher Workspace</h1>
            <p>Welcome back, {{ username }}</p>
          </div>
          <button type="button" class="logout" (click)="logout()">
            <span class="material-icons-round">logout</span>
            Logout
          </button>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </section>
    </div>
  `,
  styleUrl: '../front-office/dashboard/student-dashboard-layout.component.scss'
})
export class TeacherDashboardLayoutComponent {
  username = 'Teacher';

  constructor(
    private keycloakService: KeycloakService,
    private authService: AuthService
  ) {
    if (this.keycloakService.isLoggedIn()) {
      this.username = this.keycloakService.getUsername();
    }
  }

  logout(): void {
    void this.authService.logout('/');
  }
}
