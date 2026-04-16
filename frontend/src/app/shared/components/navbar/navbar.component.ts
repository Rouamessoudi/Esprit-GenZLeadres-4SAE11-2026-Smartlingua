import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { filter, Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner container">
        <a routerLink="/" class="logo">
          <span class="logo-icon material-icons-round">translate</span>
          <span class="logo-text">Smart<span class="logo-accent">Lingua</span></span>
        </a>

        <button class="mobile-toggle" (click)="toggleMenu()" [class.active]="menuOpen">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-menu" [class.open]="menuOpen">
          <ul class="nav-links">
            <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMenu()">Home</a></li>
            <li><a routerLink="/courses" routerLinkActive="active" (click)="closeMenu()">Courses</a></li>
            <li><a routerLink="/forum" routerLinkActive="active" (click)="closeMenu()">Forum</a></li>
            <li><a routerLink="/announcements" routerLinkActive="active" (click)="closeMenu()">Annonces</a></li>
            @if (isLoggedIn) {
              <li>
                <a routerLink="/notifications" routerLinkActive="active" (click)="closeMenu()">
                  Notifications
                  @if (unreadNotifications > 0) {
                    <span class="notif-badge">{{ unreadNotifications }}</span>
                  }
                </a>
              </li>
            }
            <li><a href="#features" (click)="closeMenu()">Features</a></li>
            <li><a href="#about" (click)="closeMenu()">About</a></li>
          </ul>
          <div class="nav-actions">
            @if (showAdminLink) {
              <a routerLink="/admin" (click)="closeMenu()" class="btn btn-secondary btn-sm">
                <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">admin_panel_settings</span>
                Admin Panel
              </a>
            }
            @if (isLoggedIn) {
              <span class="nav-username">
                <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">person</span>
                {{ username }}
              </span>
              <button (click)="logout()" class="btn btn-primary btn-sm">
                <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">logout</span>
                Logout
              </button>
            } @else {
              <button (click)="login()" class="btn btn-primary btn-sm">Sign In</button>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  isLoggedIn = false;
  isAdmin = false;
  username = '';
  showAdminLink = false;
  /** Nombre de notifications non lues (badge a cote du lien /notifications). */
  unreadNotifications = 0;
  private routerEventsSub?: Subscription;

  constructor(
    private keycloakService: KeycloakService,
    private authApiService: AuthApiService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.refreshAuthState();
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.refreshAuthState());
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  login() {
    this.router.navigate(['/auth/login']);
  }

  logout() {
    this.authApiService.clearSession();
    // Keep Keycloak logout best-effort for compatibility; ignore failures for local auth flow.
    try {
      this.keycloakService.logout(window.location.origin + '/');
    } catch {
      // no-op
    }
    this.router.navigate(['/auth/login']);
  }

  private refreshAuthState(): void {
    const sessionUser = this.authApiService.getSession();
    this.isLoggedIn = !!sessionUser;
    this.username = sessionUser?.username ?? '';
    this.isAdmin = !!sessionUser && sessionUser.role?.toUpperCase() === 'ADMIN';
    // Hide Admin Panel entry from navbar for this flow.
    this.showAdminLink = false;
    if (this.isLoggedIn) {
      this.loadUnreadCount(); // appel GET .../unread-count apres chaque navigation
    } else {
      this.unreadNotifications = 0;
    }
  }

  /** Compteur pour le badge ; en erreur API on affiche 0 pour ne pas bloquer la navbar. */
  private loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => this.unreadNotifications = res?.unreadCount ?? 0,
      error: () => this.unreadNotifications = 0
    });
  }
}
