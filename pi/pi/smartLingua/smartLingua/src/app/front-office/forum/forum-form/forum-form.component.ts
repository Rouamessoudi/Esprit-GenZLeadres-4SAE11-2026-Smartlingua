import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../../core/services/forum.service';
import { ForumPost } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forum-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="forum-form-page">
      <div class="container">
        <h1 class="page-title animate-fade-in-up">{{ isEdit ? 'Modifier le post' : 'Nouveau post' }}</h1>
        @if (error) {
          <div class="error animate-fade-in-up">{{ error }}</div>
        }
        <form (ngSubmit)="submit()" #postForm="ngForm" class="form animate-fade-in-up">
          <div class="form-group">
            <label for="title">Titre *</label>
            <input type="text" id="title" [(ngModel)]="post.title" name="title" #titleField="ngModel"
                   required minlength="3" maxlength="200" placeholder="Titre du post">
            @if (titleField.invalid && (titleField.touched || titleField.dirty)) {
              <span class="field-error">
                @if (titleField.errors?.['required']) { Le titre est obligatoire. }
                @if (titleField.errors?.['minlength']) { Le titre doit contenir au moins 3 caractères. }
                @if (titleField.errors?.['maxlength']) { Le titre ne doit pas dépasser 200 caractères. }
              </span>
            }
          </div>
          <div class="form-group">
            <label for="category">Catégorie *</label>
            <input type="text" id="category" [(ngModel)]="post.category" name="category" #categoryField="ngModel"
                   required minlength="3" maxlength="100" placeholder="Ex: Grammar, Vocabulary...">
            @if (categoryField.invalid && (categoryField.touched || categoryField.dirty)) {
              <span class="field-error">
                @if (categoryField.errors?.['required']) { La catégorie est obligatoire. }
                @if (categoryField.errors?.['minlength']) { La catégorie doit contenir au moins 3 caractères. }
                @if (categoryField.errors?.['maxlength']) { La catégorie ne doit pas dépasser 100 caractères. }
              </span>
            }
          </div>
          <div class="form-group">
            <label for="content">Contenu *</label>
            <textarea id="content" [(ngModel)]="post.content" name="content" #contentField="ngModel"
                      rows="6" required minlength="3" maxlength="10000" placeholder="Contenu de votre post"></textarea>
            @if (contentField.invalid && (contentField.touched || contentField.dirty)) {
              <span class="field-error">
                @if (contentField.errors?.['required']) { Le contenu est obligatoire. }
                @if (contentField.errors?.['minlength']) { Le contenu doit contenir au moins 3 caractères. }
                @if (contentField.errors?.['maxlength']) { Le contenu ne doit pas dépasser 10 000 caractères. }
              </span>
            }
          </div>
          <div class="form-actions">
            <a routerLink="/forum" class="btn btn-secondary">Annuler</a>
            <button type="submit" [disabled]="postForm.invalid || submitting" class="btn btn-primary">
              {{ submitting ? 'Publication...' : 'Publier' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styleUrl: './forum-form.component.scss'
})
export class ForumFormComponent implements OnInit {
  post: ForumPost = {
    title: '',
    content: '',
    authorId: 1,
    category: ''
  };
  submitting = false;
  error = '';
  isEdit = false;
  postId: number | null = null;

  constructor(
    private forumService: ForumService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.postId = +id;
      this.isEdit = true;
      this.forumService.getPost(this.postId).subscribe({
        next: (p) => {
          this.post = {
            title: p.title,
            content: p.content,
            authorId: p.authorId ?? 1,
            category: p.category ?? ''
          };
        },
        error: () => this.router.navigate(['/forum'])
      });
    }
  }

  submit(): void {
    const t = this.post.title?.trim() ?? '';
    const c = this.post.content?.trim() ?? '';
    const cat = this.post.category?.trim() ?? '';
    if (!t || !c || !cat) {
      this.error = 'Titre, catégorie et contenu sont obligatoires';
      return;
    }
    if (t.length < 3) {
      this.error = 'Le titre doit contenir au moins 3 caractères';
      return;
    }
    if (c.length < 3) {
      this.error = 'Le contenu doit contenir au moins 3 caractères';
      return;
    }
    if (cat.length < 3) {
      this.error = 'La catégorie doit contenir au moins 3 caractères';
      return;
    }
    if (t.length > 200) {
      this.error = 'Le titre ne doit pas dépasser 200 caractères';
      return;
    }
    if (cat.length > 100) {
      this.error = 'La catégorie ne doit pas dépasser 100 caractères';
      return;
    }
    this.submitting = true;
    this.error = '';
    if (this.isEdit && this.postId) {
      this.forumService.updatePost(this.postId, this.post).subscribe({
        next: (updated) => {
          this.router.navigate(['/forum', updated.id]);
          this.submitting = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.submitting = false;
        }
      });
    } else {
      this.forumService.createPost(this.post).subscribe({
        next: (created) => {
          this.router.navigate(['/forum', created.id]);
          this.submitting = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création';
          this.submitting = false;
        }
      });
    }
  }
}
