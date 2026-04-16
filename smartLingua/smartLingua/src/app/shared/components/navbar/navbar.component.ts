import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../../core/auth.service';
import { UserSyncService } from '../../../core/user-sync.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner">
        <div class="nav-left">
          <a routerLink="/" class="logo" (click)="closeMenu()">
            <span class="logo-icon material-icons-round">translate</span>
            <span class="logo-text"><span class="logo-smart">Smart</span><span class="logo-accent">Lingua</span></span>
          </a>
        </div>

        <button class="mobile-toggle" (click)="toggleMenu()" [class.active]="menuOpen" aria-label="Toggle navigation menu">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-menu" [class.open]="menuOpen">
          <div class="nav-center">
            <ul class="nav-links">
              <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a></li>
              <li><a routerLink="/courses" routerLinkActive="active" (click)="closeMenu()">Courses</a></li>
              @if (isLoggedIn && !isAdmin) {
                <li><a routerLink="/adaptive/mon-niveau" routerLinkActive="active" (click)="closeMenu()">Mon niveau</a></li>
                <li><a routerLink="/learning-path" routerLinkActive="active" (click)="closeMenu()">Learning Path</a></li>
                <li><a routerLink="/progression" routerLinkActive="active" (click)="closeMenu()">Progression</a></li>
                <li><a routerLink="/level-test" routerLinkActive="active" (click)="closeMenu()">Test final</a></li>
              }
              <li><a href="#features" (click)="closeMenu()">Features</a></li>
              <li><a href="#about" (click)="closeMenu()">About</a></li>
            </ul>
          </div>

          <div class="nav-right">
            <div class="nav-actions">
              @if (isLoggedIn) {
                @if (isAdmin) {
                  <a routerLink="/admin" (click)="closeMenu()" class="btn btn-secondary btn-sm">
                    <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">admin_panel_settings</span>
                    Admin Panel
                  </a>
                } @else {
                  <a routerLink="/adaptive/mon-niveau" (click)="closeMenu()" class="btn btn-outline btn-sm adaptive-btn">
                    <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">quiz</span>
                    Adaptive Learning
                  </a>
                }
                <span class="nav-username">
                  <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">person</span>
                  {{ username }}
                </span>
                <button (click)="logout()" class="btn btn-primary btn-sm logout-btn">
                  <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">logout</span>
                  Logout
                </button>
              } @else {
                <button (click)="login()" class="btn btn-primary btn-sm logout-btn">Sign In</button>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  isLoggedIn = false;
  isAdmin = false;
  username = '';

  constructor(
    private keycloakService: KeycloakService,
    private authService: AuthService,
    private userSyncService: UserSyncService
  ) { }

  ngOnInit() {
    this.isLoggedIn = this.keycloakService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.keycloakService.getUsername();
      this.isAdmin = this.authService.isAdmin();
      this.userSyncService.syncCurrentUser();
    }
    // Sync aussi quand Keycloak signale une connexion réussie (au retour de l'inscription/connexion)
    this.keycloakService.getKeycloakInstance().onAuthSuccess = () => {
      this.isLoggedIn = true;
      this.username = this.keycloakService.getUsername();
      this.isAdmin = this.authService.isAdmin();
      this.userSyncService.syncCurrentUser();
    };
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  login() {
    this.authService.login();
  }

  register() {
    this.authService.register();
  }

  logout() {
    this.keycloakService.logout(window.location.origin);
  }
}
