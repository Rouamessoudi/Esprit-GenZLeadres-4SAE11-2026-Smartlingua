import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../forum.service';
import { BlogPost, Comment } from '../forum.model';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <section class="post-detail-page">
      <div class="container">
        <a routerLink="/forum" class="back-link">
          <span class="material-icons-round">arrow_back</span> Back to Forum
        </a>

        @if (loading) {
          <div class="loading">Loading...</div>
        } @else if (error) {
          <div class="error">{{ error }}</div>
        } @else if (post) {
          <article class="post-detail card">
            <h1>{{ post.title }}</h1>
            <div class="post-meta">By User #{{ post.authorId }} · {{ post.createdAt | date:'medium' }}</div>
            <div class="post-content">{{ post.content }}</div>
          </article>

          <div class="comments-section">
            <h2>Comments ({{ comments.length }})</h2>

            @if (isLoggedIn) {
              <div class="comment-form card">
                <textarea [(ngModel)]="newCommentContent" placeholder="Write a comment..." rows="3"></textarea>
                <button class="btn btn-primary" (click)="submitComment()" [disabled]="sending || !newCommentContent?.trim()">
                  {{ sending ? 'Sending...' : 'Post Comment' }}
                </button>
              </div>
            } @else {
              <p class="login-hint">Sign in to leave a comment.</p>
            }

            <div class="comments-list">
              @for (c of comments; track c.id) {
                <div class="comment card">
                  <div class="comment-meta">User #{{ c.userId }} · {{ c.createdAt | date:'medium' }}</div>
                  <p class="comment-content">{{ c.content }}</p>
                </div>
              }
              @if (comments.length === 0) {
                <p class="no-comments">No comments yet.</p>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post: BlogPost | null = null;
  comments: Comment[] = [];
  loading = true;
  error = '';
  newCommentContent = '';
  sending = false;
  isLoggedIn = false;
  currentUserId = 1;

  private postId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private keycloak: KeycloakService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/forum']);
      return;
    }
    this.postId = +id;
    this.isLoggedIn = this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      try {
        const profile = this.keycloak.getKeycloakInstance().tokenParsed as { sub?: string };
        const sub = profile?.sub;
        if (sub && /^\d+$/.test(sub)) {
          this.currentUserId = parseInt(sub, 10);
        } else {
          this.currentUserId = 1;
        }
      } catch {
        this.currentUserId = 1;
      }
    }
    this.loadPost();
    this.loadComments();
  }

  loadPost() {
    this.forumService.getPost(this.postId).subscribe({
      next: (data) => {
        this.post = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Post not found';
        this.loading = false;
      }
    });
  }

  loadComments() {
    this.forumService.getComments(this.postId).subscribe({
      next: (data) => this.comments = data,
      error: () => this.comments = []
    });
  }

  submitComment() {
    const content = this.newCommentContent?.trim();
    if (!content || !this.isLoggedIn) return;
    this.sending = true;
    this.forumService.addComment(this.postId, this.currentUserId, content).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.loadComments();
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      }
    });
  }
}
