import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
import { ForumPost, Comment, CommentRequest } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="forum-detail" *ngIf="post">
      <div class="container">
        <a routerLink="/forum" class="btn-back">
          <span class="material-icons-round">arrow_back</span> Retour
        </a>

        <div class="post-detail animate-fade-in-up">
          <div class="post-header">
            <h1>{{ post.title }}</h1>
            <div class="post-actions">
              <a [routerLink]="['/forum', post.id, 'edit']" class="btn btn-sm btn-secondary">
                <span class="material-icons-round">edit</span> Modifier
              </a>
              <button type="button" (click)="deletePost()" class="btn btn-sm btn-danger">
                <span class="material-icons-round">delete</span> Supprimer
              </button>
              <button type="button" (click)="moderatePost()" class="btn btn-sm btn-outline" [class.moderated]="post.isModerated">
                <span class="material-icons-round">{{ post.isModerated ? 'check_circle' : 'verified' }}</span>
                {{ post.isModerated ? 'Modéré' : 'Modérer' }}
              </button>
            </div>
          </div>
          <p class="meta">
            @if (post.category) {
              <span class="category">{{ post.category }}</span>
            }
            <span>{{ post.createdAt | date:'medium' }}</span>
          </p>
          <div class="content">{{ post.content }}</div>
        </div>

        @if (post.id) {
          <div class="comments-section animate-fade-in-up">
            <h2>Commentaires ({{ comments.length }})</h2>
            <div class="add-comment">
              <textarea [(ngModel)]="newComment" name="newComment" #newCommentField="ngModel"
                        placeholder="Ajouter un commentaire..." rows="3" [disabled]="submitting"
                        required minlength="1" maxlength="2000"></textarea>
              @if (newCommentField.invalid && (newCommentField.touched || newCommentField.dirty)) {
                <span class="field-error">
                  @if (newCommentField.errors?.['required']) { Le commentaire est obligatoire. }
                  @if (newCommentField.errors?.['minlength']) { Le commentaire doit contenir au moins 1 caractère. }
                  @if (newCommentField.errors?.['maxlength']) { Le commentaire ne doit pas dépasser 2000 caractères. }
                </span>
              }
              <button (click)="submitComment()" [disabled]="newCommentField.invalid || submitting" class="btn btn-primary">
                {{ submitting ? 'Envoi...' : 'Publier' }}
              </button>
            </div>
            <div class="comments-list">
              @for (comment of comments; track comment.id) {
                <div class="comment-card" [class.moderated]="comment.isModerated">
                  @if (editingCommentId === comment.id) {
                    <textarea [(ngModel)]="editCommentContent" name="editComment" #editCommentField="ngModel"
                              rows="2" class="edit-textarea" required minlength="1" maxlength="2000"></textarea>
                    @if (editCommentField.invalid && (editCommentField.touched || editCommentField.dirty)) {
                      <span class="field-error">
                        @if (editCommentField.errors?.['required']) { Le commentaire est obligatoire. }
                        @if (editCommentField.errors?.['minlength']) { Au moins 1 caractère. }
                        @if (editCommentField.errors?.['maxlength']) { Maximum 2000 caractères. }
                      </span>
                    }
                    <div class="comment-actions">
                      <button (click)="saveEditComment(comment.id!)" [disabled]="editCommentField.invalid" class="btn btn-sm btn-primary">Enregistrer</button>
                      <button (click)="cancelEditComment()" class="btn btn-sm btn-secondary">Annuler</button>
                    </div>
                  } @else {
                    <p class="comment-content">{{ comment.content }}</p>
                    <p class="comment-meta">
                      {{ comment.createdAt | date:'short' }}
                      @if (comment.isModerated) {
                        <span class="badge-moderated">Modéré</span>
                      }
                    </p>
                    <div class="comment-actions">
                      <button (click)="startEditComment(comment)" class="btn btn-sm btn-outline">Modifier</button>
                      <button (click)="deleteComment(comment.id!)" class="btn btn-sm btn-outline btn-danger">Supprimer</button>
                      <button (click)="moderateComment(comment.id!, !comment.isModerated)" class="btn btn-sm btn-outline">
                        {{ comment.isModerated ? 'Démodérer' : 'Modérer' }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </section>
    @if (loading) {
      <div class="loading">Chargement...</div>
    }
    @if (error && !post) {
      <div class="error">{{ error }}</div>
    }
  `,
  styleUrl: './forum-detail.component.scss'
})
export class ForumDetailComponent implements OnInit {
  post: ForumPost | null = null;
  comments: Comment[] = [];
  loading = true;
  error = '';
  newComment = '';
  submitting = false;
  authorId = 1;
  editingCommentId: number | null = null;
  editCommentContent = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.loadPost(+id);
    }
  }

  loadPost(id: number): void {
    this.forumService.getPost(id).subscribe({
      next: (data) => {
        this.post = data;
        this.loadComments(id);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Post introuvable';
        this.loading = false;
      }
    });
  }

  loadComments(postId: number): void {
    this.forumService.getCommentsByPost(postId).subscribe({
      next: (data) => this.comments = data
    });
  }

  submitComment(): void {
    const content = this.newComment.trim();
    if (!this.post?.id || !content) return;
    if (content.length > 2000) {
      this.error = 'Le commentaire ne doit pas dépasser 2000 caractères';
      return;
    }
    this.submitting = true;
    const request: CommentRequest = {
      content,
      postId: this.post.id,
      authorId: this.authorId
    };
    this.forumService.createComment(request).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments(this.post!.id!);
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'envoi';
        this.submitting = false;
      }
    });
  }

  deletePost(): void {
    if (!this.post?.id || !confirm('Supprimer ce post ?')) return;
    this.forumService.deletePost(this.post.id).subscribe({
      next: () => this.router.navigate(['/forum']),
      error: (err) => this.error = err.error?.message || 'Erreur lors de la suppression'
    });
  }

  moderatePost(): void {
    if (!this.post?.id) return;
    this.forumService.moderatePost(this.post.id, !this.post.isModerated).subscribe({
      next: (p) => {
        this.post = p;
      },
      error: (err) => this.error = err.error?.message || 'Erreur'
    });
  }

  startEditComment(comment: Comment): void {
    this.editingCommentId = comment.id ?? null;
    this.editCommentContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  saveEditComment(id: number): void {
    const content = this.editCommentContent.trim();
    if (!content) return;
    if (content.length > 2000) {
      this.error = 'Le commentaire ne doit pas dépasser 2000 caractères';
      return;
    }
    this.forumService.updateComment(id, { content }).subscribe({
      next: () => {
        this.editingCommentId = null;
        this.editCommentContent = '';
        if (this.post?.id) this.loadComments(this.post.id);
      },
      error: (err) => this.error = err.error?.message || 'Erreur'
    });
  }

  deleteComment(id: number): void {
    if (!confirm('Supprimer ce commentaire ?')) return;
    this.forumService.deleteComment(id).subscribe({
      next: () => this.post?.id && this.loadComments(this.post.id),
      error: (err) => this.error = err.error?.message || 'Erreur'
    });
  }

  moderateComment(id: number, moderated: boolean): void {
    this.forumService.moderateComment(id, moderated).subscribe({
      next: () => this.post?.id && this.loadComments(this.post.id),
      error: (err) => this.error = err.error?.message || 'Erreur'
    });
  }
}
