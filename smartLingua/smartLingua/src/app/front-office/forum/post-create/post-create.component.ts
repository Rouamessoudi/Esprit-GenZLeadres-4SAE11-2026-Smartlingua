import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../forum.service';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="post-create-page">
      <div class="container">
        <a routerLink="/forum" class="back-link">
          <span class="material-icons-round">arrow_back</span> Back to Forum
        </a>

        <div class="page-header">
          <h1>New Post</h1>
          <p>Start a new discussion with the community.</p>
        </div>

        <div class="form-card card">
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="title">Title</label>
              <input id="title" type="text" [(ngModel)]="title" name="title" placeholder="Post title" required>
            </div>
            <div class="form-group">
              <label for="content">Content</label>
              <textarea id="content" [(ngModel)]="content" name="content" placeholder="Write your post..." rows="8" required></textarea>
            </div>
            @if (error) {
              <div class="error-msg">{{ error }}</div>
            }
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" routerLink="/forum">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="sending">{{ sending ? 'Creating...' : 'Create Post' }}</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styleUrl: './post-create.component.scss'
})
export class PostCreateComponent {
  title = '';
  content = '';
  sending = false;
  error = '';

  constructor(
    private forumService: ForumService,
    private router: Router,
    private keycloak: KeycloakService
  ) {}

  onSubmit() {
    const t = this.title?.trim();
    const c = this.content?.trim();
    if (!t || !c) {
      this.error = 'Title and content are required.';
      return;
    }
    const isLoggedIn = this.keycloak.isLoggedIn();
    const authorId = isLoggedIn ? 1 : 1;
    this.sending = true;
    this.error = '';
    this.forumService.createPost(authorId, t, c).subscribe({
      next: (post) => {
        this.router.navigate(['/forum', post.id]);
        this.sending = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to create post.';
        this.sending = false;
      }
    });
  }
}
