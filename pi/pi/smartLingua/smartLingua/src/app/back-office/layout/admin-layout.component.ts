import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <app-sidebar [collapsed]="sidebarCollapsed" (toggleCollapse)="sidebarCollapsed = !sidebarCollapsed"></app-sidebar>

      <div class="admin-main">
        <header class="admin-topbar">
          <div class="topbar-left">
            <button class="mobile-menu-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
              <span class="material-icons-round">menu</span>
            </button>
            <div class="topbar-search">
              <span class="material-icons-round">search</span>
              <input type="text" placeholder="Search anything...">
            </div>
          </div>
          <div class="topbar-right">
            <button class="topbar-icon-btn" title="Notifications">
              <span class="material-icons-round">notifications_none</span>
              <span class="notification-dot"></span>
            </button>
            <button class="topbar-icon-btn" title="Messages">
              <span class="material-icons-round">chat_bubble_outline</span>
            </button>
            <div class="topbar-divider"></div>
            <div class="topbar-user">
              <div class="topbar-avatar">
                <span class="material-icons-round">person</span>
              </div>
              <div class="topbar-user-info">
                <strong>{{ username }}</strong>
                <small>Administrator</small>
              </div>
              <span class="material-icons-round dropdown-icon">expand_more</span>
            </div>
          </div>
        </header>

        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  username = 'Admin';

  constructor(private keycloakService: KeycloakService) { }

  ngOnInit() {
    if (this.keycloakService.isLoggedIn()) {
      this.username = this.keycloakService.getUsername();
    }
  }
}
