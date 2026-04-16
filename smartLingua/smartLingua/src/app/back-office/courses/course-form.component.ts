import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CourseApiService, CourseDto, CourseLevel, ResourceType } from '../../core/services/course-api.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page">
      <h1>{{ isEdit ? 'Modifier le cours' : 'Nouveau cours' }}</h1>
      <a routerLink="/admin/courses" class="btn btn-outline">Retour</a>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="course-form">
      <div class="form-group">
        <label for="title">Titre <span class="required">*</span></label>
        <input id="title" type="text" formControlName="title">
        @if (form.get('title')?.invalid && form.get('title')?.touched) {
          <span class="error-msg">Le titre est obligatoire (min. 2 caractères).</span>
        }
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" formControlName="description" rows="3" placeholder="Description du cours"></textarea>
      </div>

      <div class="form-group">
        <label for="level">Niveau <span class="required">*</span></label>
        <select id="level" formControlName="level">
          @for (lvl of levels; track lvl) {
            <option [value]="lvl">{{ lvl }}</option>
          }
        </select>
        @if (form.get('level')?.invalid && form.get('level')?.touched) {
          <span class="error-msg">Le niveau est obligatoire.</span>
        }
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="startDate">Date de début</label>
          <input id="startDate" type="date" formControlName="startDate">
        </div>
        <div class="form-group">
          <label for="endDate">Date de fin</label>
          <input id="endDate" type="date" formControlName="endDate">
        </div>
      </div>

      <div class="form-group">
        <label for="price">Prix</label>
        <input id="price" type="number" formControlName="price" min="0" step="0.01" placeholder="0">
        @if (form.get('price')?.invalid && form.get('price')?.touched) {
          <span class="error-msg">Le prix doit être positif ou nul.</span>
        }
      </div>

      @if (!isEdit) {
        <div class="form-group form-group-check">
          <label class="check-label">
            <input type="checkbox" formControlName="autoInjectMediaPack">
            Integrer automatiquement un pack videos YouTube + podcasts apres creation
          </label>
          <small class="hint">Tu pourras toujours modifier/supprimer ces ressources dans la page Contenu du cours.</small>
        </div>
      }

      @if (submitError) {
        <p class="error-msg">{{ submitError }}</p>
      }

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
          {{ saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer') }}
        </button>
        <a routerLink="/admin/courses" class="btn btn-outline">Annuler</a>
      </div>
    </form>
  `,
  styles: [`
    .form-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .form-page h1 { margin: 0; font-size: 1.5rem; }
    .course-form { max-width: 600px; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-row .form-group { flex: 1; }
    .form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
    .required { color: #e74c3c; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;
    }
    .form-group-check { margin-top: 0.25rem; }
    .check-label { display: inline-flex !important; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; }
    .check-label input { width: auto !important; }
    .hint { display: block; margin-top: 0.35rem; color: #666; font-size: 0.82rem; }
    .error-msg { color: #e74c3c; font-size: 0.85rem; margin-top: 0.25rem; display: block; }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; border: none; cursor: pointer; font-size: 0.9rem; }
    .btn-primary { background: #6C5CE7; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid #6C5CE7; color: #6C5CE7; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class CourseFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  id?: number;
  saving = false;
  submitError = '';
  levels: CourseLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  constructor(
    private fb: FormBuilder,
    private api: CourseApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      level: ['A1', [Validators.required]],
      startDate: [''],
      endDate: [''],
      price: [null as number | null, [Validators.min(0)]],
      autoInjectMediaPack: [true]
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.isEdit = true;
      this.api.getCourse(this.id).subscribe({
        next: (c) => {
          this.form.patchValue({
            title: c.title,
            description: c.description ?? '',
            level: c.level,
            startDate: c.startDate ? c.startDate.toString().slice(0, 10) : '',
            endDate: c.endDate ? c.endDate.toString().slice(0, 10) : '',
            price: c.price ?? null
          });
        },
        error: () => this.submitError = 'Cours introuvable'
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving = true;
    this.submitError = '';
    const v = this.form.value;
    const dto: CourseDto = {
      title: v.title,
      description: v.description || undefined,
      level: v.level,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
      price: v.price != null && v.price !== '' ? +v.price : undefined
    };
    const req = this.isEdit && this.id
      ? this.api.updateCourse(this.id, dto)
      : this.api.createCourse(dto);
    req.subscribe({
      next: async (savedCourse) => {
        const shouldInjectPack = !this.isEdit && !!v.autoInjectMediaPack && !!savedCourse?.id;
        if (shouldInjectPack) {
          try {
            await this.injectDefaultMediaPack(savedCourse.id!, v.level as CourseLevel);
          } catch {
            // Don't block course creation if a third-party URL fails.
          }
        }
        this.router.navigate(['/admin/courses']);
      },
      error: (err) => {
        this.submitError = err?.error?.validationErrors
          ? Object.values(err.error.validationErrors).join(', ')
          : (err?.error?.error || 'Erreur enregistrement');
        this.saving = false;
      }
    });
  }

  private async injectDefaultMediaPack(courseId: number, level: CourseLevel): Promise<void> {
    const pack = this.buildProfessionalPack(level);

    for (const item of pack) {
      await firstValueFrom(this.api.addResource(courseId, {
        title: item.title,
        type: item.type,
        url: item.url
      }));
    }
  }

  private buildProfessionalPack(level: CourseLevel): Array<{ title: string; type: ResourceType; url: string }> {
    const byLevel: Record<CourseLevel, Array<{ title: string; type: ResourceType; url: string }>> = {
      A1: [
        { title: 'A1 Listening - British Council Playlist', type: 'VIDEO', url: 'https://www.youtube.com/playlist?list=PLMWnmna4FyDORi2JIDmi1Yr5OHhAPCWoH' },
        { title: 'A1 Listening - British Council Lessons', type: 'VIDEO', url: 'https://learnenglish.britishcouncil.org/free-resources/listening/a1' },
        { title: 'Beginner English Podcast', type: 'AUDIO', url: 'https://open.spotify.com/show/7iQXmUT7XguZcyQWfX0n3A' }
      ],
      A2: [
        { title: 'A2 Listening - British Council Playlist', type: 'VIDEO', url: 'https://www.youtube.com/playlist?list=PLMWnmna4FyDNeukpoRin9oX2qEuMnvbzP' },
        { title: 'A2 Listening - British Council Lessons', type: 'VIDEO', url: 'https://learnenglishteens.britishcouncil.org/skills/listening/a2-listening' },
        { title: 'A2 Listening Podcast Practice', type: 'AUDIO', url: 'https://open.spotify.com/show/7iQXmUT7XguZcyQWfX0n3A' }
      ],
      B1: [
        { title: 'B1 Listening - BBC 6 Minute English', type: 'VIDEO', url: 'https://www.youtube.com/playlist?list=PLcetZ6gSk96-FECmH9l7Vlx5VDigvgZpt' },
        { title: 'B1 Videos - Cambridge English', type: 'VIDEO', url: 'https://assets.cambridgeenglish.org/portal/learner/b1/videos.html' },
        { title: 'BBC Learning English Podcast', type: 'AUDIO', url: 'https://open.spotify.com/show/3fKOTwtnX5oZLaiNntKWAV' }
      ],
      B2: [
        { title: 'B2 Listening - BBC Playlist', type: 'VIDEO', url: 'https://www.youtube.com/playlist?list=PLGY7ZaBmPL0GNgX3RI-L3tzf6GPhXsmk4' },
        { title: 'B2 Videos - Cambridge English', type: 'VIDEO', url: 'https://assets.cambridgeenglish.org/portal/learner/b2/videos.html' },
        { title: 'Advanced English Podcast', type: 'AUDIO', url: 'https://open.spotify.com/show/3fKOTwtnX5oZLaiNntKWAV' }
      ],
      C1: [
        { title: 'C1 Listening - TED-Ed Lessons', type: 'VIDEO', url: 'https://ed.ted.com/lessons' },
        { title: 'C1 Videos - Cambridge English', type: 'VIDEO', url: 'https://assets.cambridgeenglish.org/portal/learner/c1/videos.html' },
        { title: 'C1 English Listening Podcast', type: 'AUDIO', url: 'https://open.spotify.com/show/3fKOTwtnX5oZLaiNntKWAV' }
      ],
      C2: [
        { title: 'C2 Proficiency - Cambridge Preparation Video', type: 'VIDEO', url: 'https://www.youtube.com/watch?v=bcfd6wMNDwo' },
        { title: 'C2 Advanced Listening Practice', type: 'VIDEO', url: 'https://www.youtube.com/watch?v=YE4fWmjk6b4' },
        { title: 'C2 Advanced English Podcast', type: 'AUDIO', url: 'https://open.spotify.com/show/3fKOTwtnX5oZLaiNntKWAV' }
      ]
    };
    return byLevel[level];
  }
}
