import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { AppNotification, CommunityDataService } from '../community/community-data.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <header class="head">
        <h2>Notifications</h2>
        <p>Consultez vos alertes et notifications importantes.</p>
      </header>
      <div class="list">
        <article class="item" *ngFor="let n of notifications">
          <div>
            <h3>{{ n.title }}</h3>
            <small>{{ n.createdAt | date:'short' }}</small>
            <span class="badge" [class.read]="n.read">{{ n.read ? 'Lu' : 'Non lu' }}</span>
          </div>
          <div class="actions">
            <button (click)="markRead(n.id)">Marquer lu</button>
            <button class="danger" (click)="remove(n.id)">Supprimer</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .head h2 { margin:0; font-size:2rem; }
    .head p { margin:4px 0 12px; color:#68749a; }
    .list { display:grid; gap:10px; }
    .item { border:1px solid #e6ebff; border-left:4px solid #6a69ff; border-radius:12px; padding:12px; background:#fff; display:flex; justify-content:space-between; gap:10px; }
    h3 { margin:0 0 4px; }
    small { color:#91a0c1; margin-right:10px; }
    .badge { padding:2px 8px; border-radius:999px; background:#ffddd7; color:#c44b33; font-size:.8rem; }
    .badge.read { background:#d8f2e5; color:#21784a; }
    .actions { display:flex; gap:8px; align-items:center; }
    button { border:1px solid #7a76ff; color:#6a69ff; background:#fff; border-radius:9px; padding:6px 10px; font-weight:600; cursor:pointer; }
    .danger { border-color:#d66d5f; color:#d66d5f; }
  `]
})
export class NotificationsPageComponent {
  notifications: AppNotification[] = [];
  private isStudent = false;

  constructor(private community: CommunityDataService, private http: HttpClient, private authService: AuthService) {
    this.isStudent = this.authService.isStudent();
    this.refresh();
  }
  markRead(id: number): void { this.community.markAsRead(id); this.refresh(); }
  remove(id: number): void { this.community.deleteNotification(id); this.refresh(); }

  private refresh(): void {
    const personal = this.community.getNotifications();
    if (!this.isStudent) {
      this.notifications = personal;
      return;
    }
    this.http.get<Array<{ id: number; title: string; createdAt: string }>>(`${forumGatewayPrefix()}/api/announcements`).subscribe({
      next: (announcements) => {
        const byAnnouncement = new Map(
          personal
            .filter((n) => n.type === 'ANNOUNCEMENT')
            .map((n) => [n.title, n])
        );
        const generated = (announcements ?? []).map((a) => {
          const title = `Nouvelle annonce: ${a.title}`;
          const existing = byAnnouncement.get(title);
          return {
            id: existing?.id ?? (100000 + a.id),
            title,
            type: 'ANNOUNCEMENT' as const,
            createdAt: a.createdAt,
            read: existing?.read ?? false
          };
        });
        const nonAnnouncement = personal.filter((n) => n.type !== 'ANNOUNCEMENT');
        const merged = [...generated, ...nonAnnouncement].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        this.community.replaceNotifications(merged);
        this.notifications = merged;
      },
      error: () => {
        this.notifications = personal;
      }
    });
  }
}
