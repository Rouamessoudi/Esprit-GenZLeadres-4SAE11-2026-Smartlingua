import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';

type ForumPost = {
  id: number;
  title: string;
  content: string;
  authorUsername?: string;
  createdAt: string;
  moderated?: boolean;
};

@Component({
  selector: 'app-forum-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="forum-wrap">
      <div class="header">
        <h2>Forum</h2>
        <p>Discuss with your learning community.</p>
      </div>

      <form class="post-form" (ngSubmit)="createPost()">
        <input [(ngModel)]="draft.title" name="title" placeholder="Post title" required />
        <textarea [(ngModel)]="draft.content" name="content" rows="4" placeholder="Write your message..." required></textarea>
        <button type="submit" [disabled]="saving">{{ saving ? 'Publishing...' : 'Publish' }}</button>
      </form>

      <p class="error" *ngIf="error">{{ error }}</p>

      <div class="posts" *ngIf="posts.length; else empty">
        <article class="post" *ngFor="let post of posts" [routerLink]="[forumBasePath, post.id]">
          <h3>{{ post.title }}</h3>
          <small class="moderated" *ngIf="post.moderated">Post moderé par un enseignant</small>
          <p>{{ post.content }}</p>
          <small>By {{ post.authorUsername || 'Utilisateur inconnu' }} - {{ post.createdAt | date:'short' }}</small>
        </article>
      </div>

      <ng-template #empty>
        <div class="empty">No forum posts yet. Create the first one.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .forum-wrap { background: #fff; border: 1px solid #e6ebff; border-radius: 14px; padding: 18px; }
    .header h2 { margin: 0; color: #1e2d5a; }
    .header p { margin: 6px 0 14px; color: #657399; }
    .post-form { display: grid; gap: 10px; margin-bottom: 16px; }
    .post-form input, .post-form textarea { border: 1px solid #dce4ff; border-radius: 10px; padding: 10px; font: inherit; }
    .post-form button { width: fit-content; background: #1f4fd4; color: #fff; border: 0; border-radius: 10px; padding: 8px 14px; cursor: pointer; }
    .error { color: #b00020; margin: 0 0 10px; }
    .posts { display: grid; gap: 10px; }
    .post { border: 1px solid #e6ebff; border-radius: 10px; padding: 12px; background: #fafcff; cursor: pointer; }
    .post h3 { margin: 0 0 6px; }
    .post p { margin: 0 0 8px; color: #2a3763; }
    .post small { color: #66739c; }
    .post .moderated { color: #8a5a00; display: block; margin-bottom: 6px; font-weight: 600; }
    .empty { color: #617099; padding: 10px 0; }
  `]
})
export class ForumPageComponent {
  posts: ForumPost[] = [];
  saving = false;
  error = '';
  forumBasePath = '/student/forum';

  draft = {
    title: '',
    content: ''
  };

  constructor(private http: HttpClient, private authService: AuthService) {
    this.forumBasePath = this.authService.isTeacher() ? '/teacher/forum' : '/student/forum';
    this.loadPosts();
  }

  private get endpoint(): string {
    return `${forumGatewayPrefix()}/forum/posts`;
  }

  loadPosts(): void {
    this.http.get<ForumPost[]>(this.endpoint).subscribe({
      next: (items) => {
        this.posts = items ?? [];
        this.error = '';
      },
      error: () => {
        this.error = 'Forum service unreachable. Check gateway and forum microservice.';
      }
    });
  }

  createPost(): void {
    this.saving = true;
    this.http.post<ForumPost>(this.endpoint, { ...this.draft, author: this.authService.getUsername() }).subscribe({
      next: () => {
        this.draft = { title: '', content: '' };
        this.saving = false;
        this.loadPosts();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = `Unable to publish post (${err.status || 'error'}).`;
      }
    });
  }
}
