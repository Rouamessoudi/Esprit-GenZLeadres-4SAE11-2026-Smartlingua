import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { Announcement } from '../community/community-data.service';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page">
      <header class="head">
        <div>
          <h2>Annonces</h2>
          <p>Restez informé des dernières actualités de SmartLingua.</p>
        </div>
        <a *ngIf="canManageAnnouncements" [routerLink]="newAnnouncementLink" class="btn">+ Nouvelle annonce</a>
      </header>
      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="list">
        <a class="item" *ngFor="let a of announcements" [routerLink]="[announcementBasePath, a.id]">
          <h3>{{ a.title }}</h3>
          <small>{{ a.createdAt | date:'medium' }}</small>
          <small>Par {{ a.authorName || a.authorUsername || 'Utilisateur inconnu' }}</small>
          <p>{{ a.content }}</p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .head { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }
    .head h2 { margin:0; font-size:2rem; }
    .head p { margin:4px 0 0; color:#67749a; }
    .error { margin: 0 0 10px; color: #b00020; }
    .btn { text-decoration:none; background:#6a69ff; color:#fff; padding:10px 14px; border-radius:10px; font-weight:600; }
    .list { display:grid; gap:10px; }
    .item { text-decoration:none; color:inherit; border:1px solid #f1e8cb; background:#fffdf3; border-radius:12px; padding:14px; display:block; }
    .item h3 { margin:0 0 6px; color:#222d49; }
    .item small { color:#9ba5be; }
    .item p { margin:10px 0 0; color:#4f5c80; }
  `]
})
export class AnnouncementsListComponent {
  announcements: Announcement[] = [];
  error = '';
  canManageAnnouncements = false;
  announcementBasePath = '/student/announcements';
  newAnnouncementLink = '/student/announcements/new';

  constructor(private http: HttpClient, private authService: AuthService) {
    this.canManageAnnouncements = this.authService.isTeacher() || this.authService.isAdmin();
    this.announcementBasePath = this.authService.isAdmin()
      ? '/admin/announcements'
      : (this.authService.isTeacher() ? '/teacher/announcements' : '/student/announcements');
    this.newAnnouncementLink = `${this.announcementBasePath}/new`;
    this.loadAnnouncements();
  }

  private loadAnnouncements(): void {
    const primaryUrl = `${forumGatewayPrefix()}/api/announcements`;
    const legacyUrl = `${forumGatewayPrefix()}/forum/announcements`;
    this.http.get<Announcement[]>(primaryUrl).pipe(
      catchError((err) => {
        if (err?.status === 404) {
          return this.http.get<Announcement[]>(legacyUrl).pipe(
            catchError((legacyErr) => {
              this.error = `Impossible de charger les annonces (${legacyErr?.status || 'erreur'}).`;
              return of([]);
            })
          );
        }
        this.error = `Impossible de charger les annonces (${err?.status || 'erreur'}).`;
        return of([]);
      })
    ).subscribe({
      next: (items) => {
        if ((items ?? []).length > 0) {
          this.error = '';
        }
        this.announcements = items ?? [];
      },
      error: () => {
        this.error = 'Impossible de charger les annonces.';
        this.announcements = [];
      }
    });
  }
}
