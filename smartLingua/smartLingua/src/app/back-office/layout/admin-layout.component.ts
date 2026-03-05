import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <header class="admin-topbar">
        <a routerLink="/admin" class="topbar-logo">
          <span class="material-icons-round">translate</span>
          <span>SmartLingua</span>
        </a>
        <nav class="topbar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="topbar-link">Dashboard</a>
          <a routerLink="/admin/courses" routerLinkActive="active" class="topbar-link">Cours</a>
          <a routerLink="/admin/quiz" routerLinkActive="active" class="topbar-link">Quiz</a>
          <a routerLink="/" class="topbar-link topbar-link-outline">Voir le site</a>
        </nav>
        <div class="topbar-right">
          <span class="topbar-user">{{ username }}</span>
          <button type="button" class="topbar-logout" (click)="logout()" title="Déconnexion">
            <span class="material-icons-round">logout</span>
          </button>
        </div>
      </header>

      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  username = 'Admin';

  constructor(private keycloakService: KeycloakService) { }

  ngOnInit() {
    if (this.keycloakService.isLoggedIn()) {
      this.username = this.keycloakService.getUsername();
    }
  }

  logout() {
    this.keycloakService.logout(window.location.origin);
  }
}
