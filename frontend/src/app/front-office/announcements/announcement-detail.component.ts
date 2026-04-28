import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { Announcement, CommunityDataService } from '../community/community-data.service';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a [routerLink]="announcementsPath" class="back">← Retour aux annonces</a>
    <section class="card" *ngIf="item">
      <h2 *ngIf="!editing">{{ item.title }}</h2>
      <input *ngIf="editing" [(ngModel)]="draftTitle" />
      <small>{{ item.createdAt | date:'medium' }}</small>
      <p *ngIf="!editing">{{ item.content }}</p>
      <textarea *ngIf="editing" rows="6" [(ngModel)]="draftContent"></textarea>
      <div class="actions" *ngIf="canManage">
        <button *ngIf="!editing" (click)="startEdit()">Modifier</button>
        <button *ngIf="editing" (click)="saveEdit()">Enregistrer</button>
        <button *ngIf="editing" (click)="cancelEdit()">Annuler</button>
        <button class="danger" (click)="deleteAnnouncement()">Supprimer</button>
      </div>
    </section>
  `,
  styles: [`
    .back { text-decoration:none; color:#6a69ff; font-weight:600; display:inline-block; margin:0 0 12px; }
    .card { border:1px solid #f1e8cb; background:#fffdf3; border-radius:12px; padding:16px; }
    h2 { margin:0 0 8px; }
    small { color:#9ba5be; }
    p { margin:14px 0; color:#49577c; }
    input, textarea { width:100%; margin-top:8px; border:1px solid #dce4ff; border-radius:10px; padding:10px; font:inherit; }
    .actions { display:flex; gap:10px; }
    button { border:1px solid #7a76ff; color:#6a69ff; background:#fff; border-radius:10px; padding:8px 14px; font-weight:600; }
    .danger { border-color:#d66d5f; color:#d66d5f; }
  `]
})
export class AnnouncementDetailComponent {
  item?: Announcement;
  canManage = false;
  editing = false;
  draftTitle = '';
  draftContent = '';
  announcementsPath = '/student/announcements';
  private id = 0;

  constructor(route: ActivatedRoute, private http: HttpClient, private authService: AuthService, private router: Router, private community: CommunityDataService) {
    this.id = Number(route.snapshot.paramMap.get('id'));
    this.canManage = this.authService.isTeacher() || this.authService.isAdmin();
    this.announcementsPath = this.authService.isTeacher() ? '/teacher/announcements' : '/student/announcements';
    this.loadItem();
  }

  startEdit(): void {
    if (!this.item) {
      return;
    }
    this.editing = true;
    this.draftTitle = this.item.title;
    this.draftContent = this.item.content;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  saveEdit(): void {
    this.http.put<Announcement>(`${forumGatewayPrefix()}/api/announcements/${this.id}`, {
      title: this.draftTitle,
      content: this.draftContent
    }).subscribe({
      next: (item) => {
        this.item = item;
        this.editing = false;
        this.community.addInfoNotification('Annonce mise a jour.', 'INFO');
      }
    });
  }

  deleteAnnouncement(): void {
    this.http.delete(`${forumGatewayPrefix()}/api/announcements/${this.id}`).subscribe({
      next: () => {
        this.community.addInfoNotification('Annonce supprimee.', 'INFO');
        void this.router.navigate([this.announcementsPath]);
      }
    });
  }

  private loadItem(): void {
    this.http.get<Announcement>(`${forumGatewayPrefix()}/api/announcements/${this.id}`).subscribe({
      next: (item) => {
        this.item = item;
      },
      error: () => {
        this.item = undefined;
      }
    });
  }
}
