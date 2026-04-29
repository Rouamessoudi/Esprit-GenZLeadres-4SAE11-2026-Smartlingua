import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { AppNotification, CommunityDataService } from '../community/community-data.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <header class="head">
        <h2>Notifications</h2>
        <p>Consultez vos alertes et notifications importantes.</p>
      </header>

      <form class="create-form" *ngIf="isTeacher" (ngSubmit)="publishNotification()">
        <input
          [(ngModel)]="newNotificationTitle"
          name="notificationTitle"
          placeholder="Ajouter une notification pour les etudiants"
          required
        />
        <button type="submit">Publier</button>
      </form>
      <p class="error" *ngIf="error">{{ error }}</p>

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
    .create-form { display:flex; gap:8px; margin: 0 0 12px; }
    .create-form input { flex:1; border:1px solid #d8def8; border-radius:9px; padding:8px 10px; }
    .list { display:grid; gap:10px; }
    .item { border:1px solid #e6ebff; border-left:4px solid #6a69ff; border-radius:12px; padding:12px; background:#fff; display:flex; justify-content:space-between; gap:10px; }
    h3 { margin:0 0 4px; }
    small { color:#91a0c1; margin-right:10px; }
    .badge { padding:2px 8px; border-radius:999px; background:#ffddd7; color:#c44b33; font-size:.8rem; }
    .badge.read { background:#d8f2e5; color:#21784a; }
    .actions { display:flex; gap:8px; align-items:center; }
    button { border:1px solid #7a76ff; color:#6a69ff; background:#fff; border-radius:9px; padding:6px 10px; font-weight:600; cursor:pointer; }
    .danger { border-color:#d66d5f; color:#d66d5f; }
    .error { margin: 0 0 10px; color:#b00020; }
  `]
})
export class NotificationsPageComponent {
  notifications: AppNotification[] = [];
  private isStudent = false;
  isTeacher = false;
  newNotificationTitle = '';
  error = '';

  constructor(private community: CommunityDataService, private http: HttpClient, private authService: AuthService) {
    this.isStudent = this.authService.isStudent();
    this.isTeacher = this.authService.isTeacher();
    this.refresh();
  }
  markRead(id: number): void { this.community.markAsRead(id); this.refresh(); }
  remove(id: number): void { this.community.deleteNotification(id); this.refresh(); }

  publishNotification(): void {
    const title = this.newNotificationTitle.trim();
    if (!title) {
      this.error = 'Le titre de notification est obligatoire.';
      return;
    }
    if (title.length < 4) {
      this.error = 'Le titre doit contenir au moins 4 caracteres.';
      return;
    }
    if (!/\D/.test(title)) {
      this.error = 'Le titre ne peut pas etre uniquement numerique.';
      return;
    }
    this.community.createTeacherNotification(title);
    this.newNotificationTitle = '';
    this.error = '';
    this.refresh();
  }

  private refresh(): void {
    const personal = this.community.getNotifications();
    const broadcasts = this.community.getBroadcastNotifications();

    if (!this.isStudent) {
      this.notifications = [...broadcasts, ...personal].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
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
        const merged = [...generated, ...broadcasts, ...nonAnnouncement]
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        this.community.replaceNotifications(merged);
        this.notifications = merged;
      },
      error: () => {
        this.notifications = [...broadcasts, ...personal].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      }
    });
  }
}
