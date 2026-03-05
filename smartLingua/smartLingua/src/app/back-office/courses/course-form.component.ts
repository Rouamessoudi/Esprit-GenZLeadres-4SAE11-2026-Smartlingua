import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseApiService, CourseDto, CourseLevel } from '../../core/services/course-api.service';

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
        <input id="title" type="text" formControlName="title" placeholder="Ex: English A1">
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
      price: [null as number | null, [Validators.min(0)]]
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
      next: () => this.router.navigate(['/admin/courses']),
      error: (err) => {
        this.submitError = err?.error?.validationErrors
          ? Object.values(err.error.validationErrors).join(', ')
          : (err?.error?.error || 'Erreur enregistrement');
        this.saving = false;
      }
    });
  }
}
