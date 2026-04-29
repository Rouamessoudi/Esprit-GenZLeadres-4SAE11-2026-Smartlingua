import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';
import { CommunityDataService } from '../community/community-data.service';

type ForumPost = {
  id: number;
  title: string;
  content: string;
  authorUsername?: string;
  createdAt: string;
  moderated?: boolean;
};

type LocalComment = { text: string; createdAt: string };

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <a [routerLink]="forumBasePath" class="back">← Retour</a>
    <section class="post" *ngIf="post">
      <h2 *ngIf="!editing">{{ post.title }}</h2>
      <input *ngIf="editing" [(ngModel)]="draftTitle" />
      <small>{{ post.authorUsername || 'Utilisateur inconnu' }} • {{ post.createdAt | date:'medium' }}</small>
      <small class="moderated" *ngIf="post.moderated">Ce post a ete modere</small>
      <p *ngIf="!editing">{{ post.content }}</p>
      <textarea *ngIf="editing" [(ngModel)]="draftContent" rows="5"></textarea>
      <div class="actions">
        <button>Signaler</button>
        <button *ngIf="canModerate && !editing" (click)="startEdit()">Modifier</button>
        <button *ngIf="canModerate && editing" (click)="saveEdit()">Enregistrer</button>
        <button *ngIf="canModerate && editing" (click)="cancelEdit()">Annuler</button>
        <button *ngIf="canModerate" (click)="moderatePost()">Moderer</button>
        <button *ngIf="canModerate" (click)="deletePost()" class="danger">Supprimer</button>
      </div>
    </section>

    <section class="comments" *ngIf="post">
      <h3>Commentaires ({{ comments.length }})</h3>
      <textarea [(ngModel)]="newComment" rows="3" placeholder="Ajouter un commentaire..."></textarea>
      <button (click)="publishComment()">Publier</button>
      <div class="comment" *ngFor="let c of comments">
        <p>{{ c.text }}</p>
        <small>{{ c.createdAt | date:'short' }}</small>
      </div>
    </section>
  `,
  styles: [`
    .back { color:#6a69ff; text-decoration:none; font-weight:600; display:inline-block; margin-bottom:10px; }
    .post, .comments { border:1px solid #e6ebff; background:#fff; border-radius:12px; padding:14px; margin-bottom:12px; }
    .post h2 { margin:0 0 6px; }
    .post small { color:#8794b6; }
    .moderated { display:block; margin-top:4px; color:#8a5a00; font-weight:600; }
    .post p { color:#435074; margin:12px 0; }
    .actions { display:flex; gap:8px; }
    button { border:1px solid #7a76ff; color:#6a69ff; background:#fff; border-radius:9px; padding:6px 10px; font-weight:600; cursor:pointer; }
    .danger { border-color:#d66d5f; color:#d66d5f; }
    textarea { width:100%; border:1px solid #dce4ff; border-radius:9px; padding:10px; font:inherit; margin-bottom:8px; }
    .comment { border-left:3px solid #6a69ff; padding-left:10px; margin-top:10px; }
  `]
})
export class ForumDetailComponent {
  post?: ForumPost;
  comments: LocalComment[] = [];
  newComment = '';
  private storageKey = '';
  forumBasePath = '/student/forum';
  isTeacher = false;
  isAdmin = false;
  canModerate = false;
  editing = false;
  draftTitle = '';
  draftContent = '';
  private postId = 0;

  constructor(route: ActivatedRoute, private http: HttpClient, private authService: AuthService, private router: Router, private community: CommunityDataService) {
    const id = Number(route.snapshot.paramMap.get('id'));
    this.postId = id;
    this.isTeacher = this.authService.isTeacher();
    this.isAdmin = this.authService.isAdmin();
    this.canModerate = this.isTeacher || this.isAdmin;
    this.forumBasePath = this.isAdmin ? '/admin/forum' : (this.isTeacher ? '/teacher/forum' : '/student/forum');
    this.storageKey = `forum_comments_${id}`;
    this.comments = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    this.http.get<ForumPost>(`${forumGatewayPrefix()}/forum/posts/${id}`).subscribe({
      next: (p) => (this.post = p),
      error: () => (this.post = undefined)
    });
  }

  publishComment(): void {
    const value = this.newComment.trim();
    if (!value) return;
    this.comments.unshift({ text: value, createdAt: new Date().toISOString() });
    localStorage.setItem(this.storageKey, JSON.stringify(this.comments));
    this.newComment = '';
  }

  startEdit(): void {
    if (!this.post || !this.canModerate) {
      return;
    }
    this.editing = true;
    this.draftTitle = this.post.title;
    this.draftContent = this.post.content;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  saveEdit(): void {
    if (!this.canModerate || !this.postId) {
      return;
    }
    this.http.put<ForumPost>(`${forumGatewayPrefix()}/forum/posts/${this.postId}`, {
      title: this.draftTitle,
      content: this.draftContent
    }).subscribe({
      next: (updated) => {
        this.post = updated;
        this.editing = false;
        this.community.addInfoNotification('Post mis a jour.', 'FORUM');
      }
    });
  }

  moderatePost(): void {
    if (!this.canModerate || !this.postId) {
      return;
    }
    this.http.post<ForumPost>(`${forumGatewayPrefix()}/forum/posts/${this.postId}/moderate`, {}).subscribe({
      next: (updated) => {
        this.post = updated;
        this.community.addInfoNotification('Post modere.', 'FORUM');
      }
    });
  }

  deletePost(): void {
    if (!this.canModerate || !this.postId) {
      return;
    }
    this.http.delete(`${forumGatewayPrefix()}/forum/posts/${this.postId}`).subscribe({
      next: () => {
        this.community.addInfoNotification('Post supprime.', 'FORUM');
        void this.router.navigate([this.forumBasePath]);
      }
    });
  }
}
