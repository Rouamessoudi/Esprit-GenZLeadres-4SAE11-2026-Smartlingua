import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { hasSession, getSessionUser, clearSession } from '../../../core/services/local-session.service';
import { WebrtcCallService } from '../../../core/services/webrtc-call.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
            <li><a routerLink="/chat" routerLinkActive="active" (click)="navigateToChat($event)">Chat</a></li>
            <li><a routerLink="/ai-assistant" routerLinkActive="active" (click)="closeMenu()">AI Assistant</a></li>
            @if (isLoggedIn) {
            <li>
              <a routerLink="/translate" routerLinkActive="active" (click)="closeMenu()">
                <span class="material-icons-round nav-link-icon">language</span>
                Translate
              </a>
            </li>
            }
            <li><a href="#features" (click)="closeMenu()">Features</a></li>
            <li><a href="#about" (click)="closeMenu()">About</a></li>
          </ul>
          <div class="nav-actions">
            @if (isLoggedIn) {
              @if (isAdmin) {
                <a routerLink="/admin" (click)="closeMenu()" class="btn btn-secondary btn-sm">
                  <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">admin_panel_settings</span>
                  Admin Panel
                </a>
              }
              <span class="nav-username">
                @if (isTeacher) {<span class="teacher-icon" aria-label="Enseignant">👨‍🏫</span> } @else {<span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">person</span> }
                {{ username }}
              </span>
              <button (click)="logout()" class="btn btn-primary btn-sm">
                <span class="material-icons-round" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">logout</span>
                Logout
              </button>
            } @else {
              <a routerLink="/login" (click)="closeMenu()" class="btn btn-primary btn-sm">Sign In</a>
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
  isTeacher = false;
  username = '';
  private sub?: Subscription;

  constructor(
    private router: Router,
    private webrtc: WebrtcCallService
  ) {}

  ngOnInit() {
    this.updateAuthState();
    this.sub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => this.updateAuthState());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  updateAuthState() {
    if (hasSession()) {
      const u = getSessionUser();
      this.isLoggedIn = true;
      this.username = u?.username ?? '';
      this.isAdmin = u?.role === 'admin';
      this.isTeacher = u?.role === 'teacher';
      return;
    }
    this.isLoggedIn = false;
    this.username = '';
    this.isAdmin = false;
    this.isTeacher = false;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  navigateToChat(event: Event) {
    event.preventDefault();
    this.closeMenu();
    this.router.navigate(['/chat']);
  }

  logout() {
    this.webrtc.disconnect();
    clearSession();
    window.location.href = '/login';
  }
}
