import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-header">
        <a routerLink="/" class="sidebar-logo">
          <span class="material-icons-round logo-icon">translate</span>
          @if (!collapsed) {
            <span class="logo-text">Smart<span class="accent">Lingua</span></span>
          }
        </a>
        <button class="collapse-btn" (click)="toggleCollapse.emit()">
          <span class="material-icons-round">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label" [class.sr-only]="collapsed">MAIN</span>
          @for (item of mainMenu; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{exact: item.exact}"
               class="nav-item" [title]="item.label">
              <span class="material-icons-round">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </div>
        <div class="nav-section">
          <span class="nav-section-label" [class.sr-only]="collapsed">MANAGEMENT</span>
          @for (item of managementMenu; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" [title]="item.label">
              <span class="material-icons-round">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">
            <span class="material-icons-round">person</span>
          </div>
          @if (!collapsed) {
            <div class="user-info">
              <strong>{{ username }}</strong>
              <small>Administrator</small>
            </div>
          }
        </div>
        <button class="logout-btn" (click)="logout()" [title]="'Logout'">
          <span class="material-icons-round">logout</span>
          @if (!collapsed) {
            <span class="logout-label">Logout</span>
          }
        </button>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  username = 'Admin';

  mainMenu = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard', exact: true, badge: '' },
    { icon: 'school', label: 'Courses', route: '/admin/courses', exact: false, badge: '12' },
    { icon: 'people', label: 'Students', route: '/admin/students', exact: false, badge: '' },
    { icon: 'quiz', label: 'Quizzes', route: '/admin/quizzes', exact: false, badge: '3' },
    { icon: 'assignment', label: 'Enrollments', route: '/admin/enrollments', exact: false, badge: '' },
  ];

  managementMenu = [
    { icon: 'analytics', label: 'Analytics', route: '/admin/analytics' },
    { icon: 'settings', label: 'Settings', route: '/admin/settings' },
    { icon: 'help_outline', label: 'Help Center', route: '/admin/help' },
  ];

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
