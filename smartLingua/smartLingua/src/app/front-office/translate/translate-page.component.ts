import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  TranslationHistoryItem,
  TranslationLanguage,
  TranslationService,
} from '../../core/services/translation.service';
import { getSessionUser } from '../../core/services/local-session.service';

@Component({
  selector: 'app-translate-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="translate-page">
      <div class="container">
        <div class="translate-layout">
          <div class="translate-card card">
          <div class="header">
            <h1>Translate</h1>
            <p>Translate text with multiple languages and keep your history.</p>
          </div>

          <div class="field">
            <label for="sourceText">Text to translate</label>
            <textarea
              id="sourceText"
              [(ngModel)]="sourceText"
              rows="6"
              placeholder="Enter your text here..."
            ></textarea>
          </div>

          <div class="language-row">
            <div class="field">
              <label for="sourceLang">Source language</label>
              <select id="sourceLang" [(ngModel)]="sourceLanguage">
                @for (lang of languages; track lang.code) {
                  <option [value]="lang.code">{{ lang.label }}</option>
                }
              </select>
            </div>

            <button
              type="button"
              class="btn btn-secondary swap-btn"
              (click)="swapLanguages()"
              aria-label="Swap languages"
            >
              <span class="material-icons-round">swap_horiz</span>
            </button>

            <div class="field">
              <label for="targetLang">Target language</label>
              <select id="targetLang" [(ngModel)]="targetLanguage">
                @for (lang of languages; track lang.code) {
                  <option [value]="lang.code">{{ lang.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="actions">
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="isLoading || !sourceText.trim()"
              (click)="onTranslate()"
            >
              @if (isLoading) {
                Translating...
              } @else {
                Translate
              }
            </button>
          </div>

          @if (errorMessage) {
            <p class="error">{{ errorMessage }}</p>
          }

          <div class="output">
            <div class="output-header">
              <h2>Translated text</h2>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="!translatedText"
                (click)="copyTranslation()"
              >
                <span class="material-icons-round">content_copy</span>
                Copy
              </button>
            </div>
            <div class="output-box">
              @if (translatedText) {
                {{ translatedText }}
              } @else {
                <span class="placeholder">Your translated text will appear here.</span>
              }
            </div>
            @if (copyFeedback) {
              <p class="copy-feedback">{{ copyFeedback }}</p>
            }
          </div>
          </div>

          <aside class="history-card card">
            <div class="history-header">
              <h2>History</h2>
            </div>
            @if (!isLoggedIn) {
              <p class="history-empty">Login to save and view your translation history.</p>
            } @else if (history.length === 0) {
              <p class="history-empty">No history yet.</p>
            } @else {
              <div class="history-list">
                @for (item of history; track item.id) {
                  <button class="history-item" type="button" (click)="reuseHistory(item)">
                    <div class="history-meta">
                      <span>{{ item.sourceLanguage.toUpperCase() }} → {{ item.targetLanguage.toUpperCase() }}</span>
                      <small>{{ item.provider }}</small>
                    </div>
                    <p class="history-input">{{ item.inputText }}</p>
                    <p class="history-output">{{ item.translatedText }}</p>
                  </button>
                }
              </div>
            }
          </aside>
        </div>
        </div>
    </section>
  `,
  styleUrl: './translate-page.component.scss',
})
export class TranslatePageComponent implements OnInit {
  sourceText = '';
  translatedText = '';
  sourceLanguage = 'en';
  targetLanguage = 'fr';
  isLoading = false;
  errorMessage = '';
  copyFeedback = '';
  isLoggedIn = false;
  history: TranslationHistoryItem[] = [];

  languages: Array<{ code: string; label: string }> = [];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.isLoggedIn = !!getSessionUser();
    this.loadLanguages();
    this.loadHistory();
  }

  onTranslate(): void {
    this.errorMessage = '';
    this.copyFeedback = '';
    this.translatedText = '';

    if (!this.sourceText.trim()) {
      this.errorMessage = 'Please enter text to translate.';
      return;
    }

    if (this.sourceLanguage === this.targetLanguage) {
      this.errorMessage = 'Source and target languages must be different.';
      return;
    }

    this.isLoading = true;
    this.translationService
      .translate(this.sourceText.trim(), this.sourceLanguage, this.targetLanguage)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (res) => {
          this.translatedText = res.translatedText ?? '';
          this.loadHistory();
        },
        error: (err: Error) => {
          this.errorMessage = err.message || 'Translation failed.';
        },
      });
  }

  swapLanguages(): void {
    const prevSource = this.sourceLanguage;
    this.sourceLanguage = this.targetLanguage;
    this.targetLanguage = prevSource;
  }

  async copyTranslation(): Promise<void> {
    if (!this.translatedText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.translatedText);
      this.copyFeedback = 'Copied to clipboard.';
      setTimeout(() => (this.copyFeedback = ''), 2000);
    } catch {
      this.errorMessage = 'Unable to copy automatically. Please copy manually.';
    }
  }

  reuseHistory(item: TranslationHistoryItem): void {
    this.sourceText = item.inputText;
    this.translatedText = item.translatedText;
    this.sourceLanguage = item.sourceLanguage;
    this.targetLanguage = item.targetLanguage;
    this.errorMessage = '';
  }

  private loadLanguages(): void {
    this.translationService.getLanguages().subscribe({
      next: (langs: TranslationLanguage[]) => {
        this.languages = langs.map((l) => ({ code: l.code, label: l.name }));
        if (!this.languages.some((l) => l.code === this.sourceLanguage)) {
          this.sourceLanguage = this.languages[0]?.code ?? 'en';
        }
        if (!this.languages.some((l) => l.code === this.targetLanguage)) {
          this.targetLanguage = this.languages[1]?.code ?? this.languages[0]?.code ?? 'fr';
        }
      },
      error: () => {
        // Minimal fallback to keep page usable if languages endpoint is unavailable.
        this.languages = [
          { code: 'en', label: 'English' },
          { code: 'fr', label: 'French' },
          { code: 'ar', label: 'Arabic' },
        ];
      },
    });
  }

  private loadHistory(): void {
    if (!this.isLoggedIn) return;
    this.translationService.getHistory().subscribe({
      next: (rows) => {
        this.history = rows;
      },
      error: () => {
        this.history = [];
      },
    });
  }
}
