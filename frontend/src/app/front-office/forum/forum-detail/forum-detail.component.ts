import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { ForumPost, Comment, CommentRequest } from '../../../core/models/forum.model';
import { KeycloakService } from 'keycloak-angular';
import type { NgForm } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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
              <button type="button" class="btn-like" (click)="toggleLike()" [class.liked]="post.userLiked" [disabled]="likeLoading">
                <span class="material-icons-round">{{ post.userLiked ? 'favorite' : 'favorite_border' }}</span>
                <span>{{ post.likesCount ?? 0 }}</span>
              </button>
              <button type="button" class="btn btn-sm btn-outline" (click)="reportPost()" [disabled]="reportLoading" title="Signaler ce post">
                <span class="material-icons-round">flag</span> Signaler
              </button>
              <a [routerLink]="['/forum', post.id, 'edit']" class="btn btn-sm btn-secondary">
                <span class="material-icons-round">edit</span> Modifier
              </a>
              @if (canDeletePost) {
                <button type="button" (click)="deletePost()" class="btn btn-sm btn-danger">
                  <span class="material-icons-round">delete</span> Supprimer
                </button>
              }
              @if (canModerate) {
                <button type="button" (click)="moderatePost()" class="btn btn-sm btn-outline" [class.moderated]="post.isModerated">
                  <span class="material-icons-round">{{ post.isModerated ? 'check_circle' : 'verified' }}</span>
                  {{ post.isModerated ? 'Modéré' : 'Modérer' }}
                </button>
              }
            </div>
          </div>
          <p class="meta">
            @if (post.category) {
              <span class="category">{{ post.category }}</span>
            }
            <span>Auteur #{{ post.authorId }}</span>
            @if (post.trending) {
              <span>Trending</span>
            }
            @if (post.status) {
              <span>Statut: {{ post.status }}</span>
            }
            @if (post.updatedAt) {
              <span>Mis à jour: {{ post.updatedAt | date:'medium' }}</span>
            }
            <span>{{ post.createdAt | date:'medium' }}</span>
          </p>
          <div class="content">{{ post.content }}</div>
        </div>

        @if (post.id) {
          <div class="comments-section animate-fade-in-up">
            <h2>Commentaires ({{ comments.length }})</h2>
            <form #commentForm="ngForm" (ngSubmit)="submitComment(commentForm)" class="add-comment">
              <textarea [(ngModel)]="newComment" name="newComment" #newCommentField="ngModel"
                        [ngModelOptions]="{updateOn: 'change'}"
                        placeholder="Ajouter un commentaire..." rows="3" [disabled]="submitting"
                        required minlength="1" maxlength="2000"></textarea>
              @if (newCommentField.invalid && (newCommentField.touched || newCommentField.dirty)) {
                <span class="field-error">
                  @if (newCommentField.errors?.['required']) { Le commentaire est obligatoire. }
                  @if (newCommentField.errors?.['minlength']) { Le commentaire doit contenir au moins 1 caractère. }
                  @if (newCommentField.errors?.['maxlength']) { Le commentaire ne doit pas dépasser 2000 caractères. }
                </span>
              }
              <button type="submit" [disabled]="newCommentField.invalid || submitting" class="btn btn-primary">
                {{ submitting ? 'Envoi...' : 'Publier' }}
              </button>
            </form>
            @if (commentsLoading) {
              <div class="loading">Chargement des commentaires...</div>
            }
            @if (commentsError) {
              <div class="error">{{ commentsError }}</div>
            }
            <div class="comments-list">
              @if (!commentsLoading && !commentsError && comments.length === 0) {
                <div class="empty">
                  <span class="material-icons-round empty-icon">chat_bubble_outline</span>
                  <p>Aucun commentaire pour le moment.</p>
                </div>
              }
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
  currentUserId = 1;
  likeLoading = false;
  reportLoading = false;
  editingCommentId: number | null = null;
  editCommentContent = '';
  commentsLoading = false;
  commentsError = '';

  canModerate = false;
  canDeletePost = false;
  currentUserRole = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private authApiService: AuthApiService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    const session = this.authApiService.getSession();
    if (!session?.id) {
      this.error = 'Veuillez vous connecter pour accéder à cette fonctionnalité';
      this.router.navigate(['/auth/login']);
      return;
    }
    this.authorId = session.id;
    this.currentUserId = session.id;
    this.currentUserRole = this.authApiService.getUserRole() ?? '';
    try {
      this.canModerate = environment.devBypassAuth || (this.keycloakService.getUserRoles() ?? []).some(r => r === 'admin' || r === 'teacher');
    } catch {
      this.canModerate = false;
    }
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.loadPost(+id);
      }
    });
  }

  loadPost(id: number): void {
    this.loading = true;
    this.error = '';
    this.forumService.getPost(id, this.currentUserId).subscribe({
      next: (data) => {
        this.post = this.normalizePost(data);
        this.canDeletePost = this.isAdmin() || this.post.authorId === this.currentUserId;
        this.loadComments(id);
        this.loading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Post introuvable');
        this.post = null;
        this.loading = false;
      }
    });
  }

  loadComments(postId: number): void {
    this.commentsLoading = true;
    this.commentsError = '';
    this.forumService.getCommentsByPost(postId).subscribe({
      next: (data) => {
        this.comments = data ?? [];
        this.commentsLoading = false;
      },
      error: (err) => {
        this.comments = [];
        this.commentsError = this.extractApiError(err, 'Erreur lors du chargement des commentaires');
        this.commentsLoading = false;
      }
    });
  }

  submitComment(form?: NgForm): void {
    const content = this.newComment.trim();
    if (!this.post?.id) return;
    if (!content) {
      this.error = 'Le commentaire est obligatoire';
      return;
    }
    if (content.length > 2000) {
      this.error = 'Le commentaire ne doit pas dépasser 2000 caractères';
      return;
    }
    this.submitting = true;
    this.error = '';
    const request: CommentRequest = {
      content,
      postId: this.post.id,
      authorId: this.authorId
    };
    this.forumService.createComment(request).subscribe({
      next: () => {
        this.newComment = '';
        form?.resetForm();
        this.loadComments(this.post!.id!);
        this.submitting = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Erreur lors de l\'envoi');
        this.submitting = false;
      }
    });
  }

  deletePost(): void {
    if (!this.post?.id) return;
    if (!this.canDeletePost) {
      this.error = 'Action non autorisee';
      return;
    }
    if (!confirm('Supprimer ce post ? Cette action est irreversible.')) return;
    this.forumService.deletePost(this.post.id).subscribe({
      next: () => this.router.navigate(['/forum']),
      error: (err) => this.error = this.extractApiError(err, 'Erreur lors de la suppression')
    });
  }

  toggleLike(): void {
    if (!this.post?.id || this.likeLoading) return;
    this.likeLoading = true;
    const req = this.post.userLiked
      ? this.forumService.unlikePost(this.post.id, this.currentUserId)
      : this.forumService.likePost(this.post.id, this.currentUserId);
    req.subscribe({
      next: (res) => {
        if (this.post) {
          this.post.likesCount = res.likesCount;
          this.post.userLiked = res.liked;
        }
        this.likeLoading = false;
      },
      error: () => { this.likeLoading = false; }
    });
  }

  reportPost(): void {
    if (!this.post?.id || this.reportLoading) return;
    const reason = prompt('Raison du signalement (optionnel) :');
    if (reason === null) return;
    this.reportLoading = true;
    this.forumService.reportPost(this.post.id, this.currentUserId, reason || undefined).subscribe({
      next: () => {
        alert('Post signalé. Les modérateurs vont l\'examiner.');
        if (this.post?.id) this.loadPost(this.post.id);
        this.reportLoading = false;
      },
      error: (err) => {
        this.error = this.extractApiError(err, 'Erreur lors du signalement');
        this.reportLoading = false;
      }
    });
  }

  moderatePost(): void {
    if (!this.post?.id) return;
    this.forumService.moderatePost(this.post.id, !this.post.isModerated).subscribe({
      next: (p) => {
        this.post = this.normalizePost(p);
        if (this.post?.id) this.loadComments(this.post.id);
      },
      error: (err) => this.error = this.extractApiError(err, 'Erreur')
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
      error: (err) => this.error = this.extractApiError(err, 'Erreur')
    });
  }

  deleteComment(id: number): void {
    if (!confirm('Supprimer ce commentaire ?')) return;
    this.forumService.deleteComment(id).subscribe({
      next: () => this.post?.id && this.loadComments(this.post.id),
      error: (err) => this.error = this.extractApiError(err, 'Erreur')
    });
  }

  moderateComment(id: number, moderated: boolean): void {
    this.forumService.moderateComment(id, moderated).subscribe({
      next: () => this.post?.id && this.loadComments(this.post.id),
      error: (err) => this.error = this.extractApiError(err, 'Erreur')
    });
  }

  private normalizePost(post: ForumPost): ForumPost {
    return {
      ...post,
      title: post.title ?? '',
      content: post.content ?? '',
      category: post.category ?? '',
      likesCount: post.likesCount ?? 0,
      userLiked: post.userLiked ?? false,
      trending: post.trending ?? false
    };
  }

  private extractApiError(err: any, fallback: string): string {
    if (err?.status === 403) {
      return 'Action non autorisee';
    }
    if (err?.status === 401) {
      return 'Veuillez vous connecter pour acceder a cette fonctionnalite';
    }
    if (err?.status === 0) {
      return 'Impossible de joindre le serveur forum (port 8090).';
    }
    const fieldErrors = err?.error?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstMessage = Object.values(fieldErrors)[0];
      if (typeof firstMessage === 'string' && firstMessage.trim()) {
        return this.toFrenchMessage(firstMessage);
      }
    }
    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return this.toFrenchMessage(message);
    }
    return fallback;
  }

  private toFrenchMessage(message: string): string {
    const map: Record<string, string> = {
      'Validation failed': 'Validation echouee',
      'Content is required': 'Le contenu est obligatoire',
      'Post ID is required': 'Le post est obligatoire',
      'Author ID is required': 'L auteur est obligatoire',
      'Comment not found': 'Commentaire introuvable',
      'Forum post not found': 'Post introuvable',
      "Vous n'etes pas autorise a supprimer ce post": 'Action non autorisee'
    };
    return map[message] ?? message;
  }

  private isAdmin(): boolean {
    return this.currentUserRole.trim().toUpperCase() === 'ADMIN';
  }
}
