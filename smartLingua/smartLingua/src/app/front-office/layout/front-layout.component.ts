import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { getSessionUser, hasSession } from '../../core/services/local-session.service';
import { AssistantResource, EnglishAssistantService } from '../../core/services/english-assistant.service';
import { TranslationLanguage, TranslationService } from '../../core/services/translation.service';
import { AiService } from '../../core/services/ai.service';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    @if (isLoggedIn()) {
      <button class="chatbot-fab" aria-label="Open English Assistant" (click)="toggleChat()">
        <span class="material-icons-round">smart_toy</span>
      </button>

      @if (chatOpen) {
      <section class="chatbot-popup card">
        <header class="chatbot-header">
          <button type="button" class="header-icon-btn header-back" (click)="onHeaderBack()" aria-label="Back">
            <span class="material-icons-round">arrow_back</span>
            @if (historyCount > 0) {
              <span class="header-badge">{{ historyBadgeLabel }}</span>
            }
          </button>
          <div class="header-center">
            <button type="button" class="history-icon-btn" (click)="toggleHistoryPanel()" aria-label="Conversation history">
              <span class="material-icons-round">history</span>
            </button>
            <span class="header-online">Online</span>
          </div>
          <button type="button" class="header-icon-btn" (click)="closeChat()" aria-label="Close">
            <span class="material-icons-round">close</span>
          </button>
        </header>

        <div class="chatbot-body">
          @if (showHistoryPanel) {
            @if (historyLoading) {
              <div class="loading-center"><div class="spinner"></div></div>
            } @else if (historyItems.length === 0) {
              <p class="placeholder">No history yet.</p>
            } @else {
              @for (h of historyItems; track h.id) {
                <div class="history-row">
                  <span class="history-level">{{ h.level || '-' }}</span>
                  <p class="history-q">{{ h.message }}</p>
                  <p class="history-a">{{ h.response }}</p>
                </div>
              }
            }
          } @else {
            @if (messages.length === 0 && !loading) {
              <p class="placeholder">Ask: "I am B1, give me playlists".</p>
            }
            @if (messages.length === 0 && loading) {
              <div class="loading-center"><div class="spinner"></div></div>
            }
            @if (messages.length > 0) {
              @for (m of messages; track $index) {
                <div class="bubble" [class.user]="m.sender === 'user'" [class.bot]="m.sender === 'bot'">{{ m.content }}</div>
              }
              @if (loading) {
                <div class="loading-inline"><div class="spinner spinner-sm"></div></div>
              }
            }
          }
        </div>

        @if (!showHistoryPanel && recommendations.length > 0) {
        <div class="resources">
          @for (res of recommendations; track res.id) {
            <div class="resource-item">
              <small>{{ res.level }} - {{ res.category }}</small>
              <a [href]="res.url" target="_blank" rel="noopener">{{ res.title }}</a>
            </div>
          }
        </div>
        }

        @if (!showHistoryPanel) {
        <div class="chatbot-extra">
          <div class="assistant-mode">
            <span class="mode-label">Mode</span>
            <select [(ngModel)]="assistantMode" (ngModelChange)="onAssistantModeChange()">
              <option value="english">English Assistant</option>
              <option value="ai">AI Assistant</option>
            </select>
          </div>
          <label class="translate-toggle">
            <input type="checkbox" [(ngModel)]="translateMode" (ngModelChange)="onTranslateModeChange()" />
            <span class="material-icons-round translate-icon">translate</span>
            <span>Traduire</span>
          </label>
          @if (translateMode) {
            <div class="translate-lang-row">
              <select [(ngModel)]="translateSource" class="lang-select" title="Langue source">
                @for (lang of translateLanguages; track lang.code) {
                  <option [value]="lang.code">{{ lang.label }}</option>
                }
              </select>
              <button type="button" class="swap-langs" (click)="swapTranslateLangs()" title="Inverser les langues">
                <span class="material-icons-round">swap_horiz</span>
              </button>
              <select [(ngModel)]="translateTarget" class="lang-select" title="Langue cible">
                @for (lang of translateLanguages; track lang.code) {
                  <option [value]="lang.code">{{ lang.label }}</option>
                }
              </select>
            </div>
          }
        </div>
        <div class="chatbot-composer" [class.translate-composer]="translateMode">
          @if (!translateMode && assistantMode === 'english') {
          <select [(ngModel)]="selectedLevel">
            <option value="">level?</option>
            @for (lvl of levels; track lvl) {
              <option [value]="lvl">{{ lvl }}</option>
            }
          </select>
          }
          <input [(ngModel)]="message" (keyup.enter)="send()" [placeholder]="translateMode ? 'Texte à traduire...' : (assistantMode === 'ai' ? 'Ask AI assistant...' : 'Type your message...')" />
          <button type="button" class="btn btn-primary btn-sm" [disabled]="loading || !message.trim()" (click)="send()">
            {{ loading ? '...' : (translateMode ? 'Traduire' : (assistantMode === 'ai' ? 'Ask AI' : 'Send')) }}
          </button>
        </div>
        }
      </section>
      }
    }
    <app-footer></app-footer>
  `,
  styles: [`
    .main-content {
      padding-top: 72px;
      min-height: 100vh;
    }
    .chatbot-fab {
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 1200;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(108, 92, 231, 0.35);
      transition: var(--transition);
    }
    .chatbot-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 28px rgba(108, 92, 231, 0.4);
    }
    .chatbot-popup {
      position: fixed;
      right: 20px;
      bottom: 92px;
      width: min(390px, calc(100vw - 24px));
      z-index: 1201;
      padding: 0;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 16px 38px rgba(0,0,0,0.18);
      overflow: hidden;
    }
    .chatbot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 10px;
      border-bottom: 1px solid #ececec;
      background: #fff;
    }
    .header-icon-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 4px;
      color: #111;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .header-icon-btn .material-icons-round {
      font-size: 22px;
    }
    .header-back {
      position: relative;
    }
    .header-badge {
      position: absolute;
      top: -4px;
      right: -6px;
      min-width: 22px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: #2e7d32;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .header-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .history-icon-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      color: #111;
      line-height: 1;
    }
    .history-icon-btn .material-icons-round {
      font-size: 26px;
    }
    .header-online {
      font-size: 12px;
      font-weight: 600;
      color: #2e7d32;
    }
    .chatbot-body {
      max-height: 260px;
      min-height: 120px;
      overflow: auto;
      padding: 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #fff;
    }
    .loading-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100px;
    }
    .loading-inline {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e8e8e8;
      border-top-color: #9e9e9e;
      border-radius: 50%;
      animation: chatbot-spin 0.75s linear infinite;
    }
    .spinner-sm {
      width: 28px;
      height: 28px;
      border-width: 2px;
    }
    @keyframes chatbot-spin {
      to { transform: rotate(360deg); }
    }
    .history-row {
      border: 1px solid #f0f0f0;
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 8px;
      background: #fafafa;
    }
    .history-level {
      font-size: 10px;
      font-weight: 700;
      color: #666;
    }
    .history-q { margin: 4px 0 0; font-size: 13px; color: #222; }
    .history-a { margin: 4px 0 0; font-size: 12px; color: #555; }
    .bubble {
      max-width: 88%;
      padding: 8px 10px;
      border-radius: 10px;
      font-size: .9rem;
      line-height: 1.35;
    }
    .bubble.user {
      margin-left: auto;
      background: rgba(108, 92, 231, 0.15);
    }
    .bubble.bot {
      background: rgba(0,0,0,0.06);
    }
    .resources {
      max-height: 120px;
      overflow: auto;
      border-top: 1px solid #f2f2f2;
      border-bottom: 1px solid #f2f2f2;
      padding: 8px 12px;
    }
    .resource-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 6px;
    }
    .resource-item a {
      color: var(--primary);
      text-decoration: underline;
      font-size: .86rem;
    }
    .placeholder { color: #8b8b8b; font-size: .9rem; }
    .chatbot-extra {
      padding: 8px 12px 0;
      border-top: 1px solid #f2f2f2;
      background: #fafbff;
    }
    .assistant-mode {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .mode-label {
      font-size: 12px;
      color: #666;
      font-weight: 600;
      min-width: 34px;
    }
    .assistant-mode select {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 12px;
    }
    .translate-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #444;
      cursor: pointer;
      user-select: none;
    }
    .translate-toggle input { accent-color: var(--primary); }
    .translate-icon { font-size: 18px; color: var(--primary); }
    .translate-lang-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
    }
    .translate-lang-row .lang-select {
      flex: 1;
      min-width: 0;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 11px;
    }
    .swap-langs {
      border: none;
      background: #eee;
      border-radius: 8px;
      padding: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .swap-langs .material-icons-round { font-size: 20px; color: #333; }
    .chatbot-composer {
      display: grid;
      grid-template-columns: 86px 1fr auto;
      gap: 8px;
      padding: 10px 12px 12px;
      border-top: 1px solid #f2f2f2;
      background: #fff;
    }
    .chatbot-composer.translate-composer {
      grid-template-columns: 1fr auto;
    }
    .chatbot-composer select, .chatbot-composer input {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px;
      font-size: .85rem;
    }
  `]
})
export class FrontLayoutComponent {
  chatOpen = false;
  loading = false;
  message = '';
  selectedLevel = '';
  recommendations: AssistantResource[] = [];
  messages: Array<{ sender: 'user' | 'bot'; content: string }> = [];
  readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  assistantMode: 'english' | 'ai' = 'english';
  aiConversationId: number | null = null;

  showHistoryPanel = false;
  historyLoading = false;
  historyItems: Array<{ id: number; message: string; response: string; level: string; createdAt: string }> = [];
  historyCount = 0;

  /** Mode traduction intégré (API /api/translate). */
  translateMode = false;
  translateSource = 'en';
  translateTarget = 'fr';
  translateLanguages: Array<{ code: string; label: string }> = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
  ];

  constructor(
    private assistantService: EnglishAssistantService,
    private translationService: TranslationService,
    private aiService: AiService
  ) {}

  get historyBadgeLabel(): string {
    return this.historyCount > 99 ? '99+' : String(this.historyCount);
  }

  isLoggedIn(): boolean {
    return hasSession();
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.showHistoryPanel = false;
      this.refreshHistoryCount();
      this.loadTranslateLanguages();
    }
  }

  onTranslateModeChange(): void {
    if (this.translateMode) {
      this.recommendations = [];
    }
  }

  onAssistantModeChange(): void {
    this.recommendations = [];
    this.translateMode = false;
  }

  swapTranslateLangs(): void {
    const s = this.translateSource;
    this.translateSource = this.translateTarget;
    this.translateTarget = s;
  }

  private loadTranslateLanguages(): void {
    this.translationService.getLanguages().subscribe({
      next: (langs: TranslationLanguage[]) => {
        this.translateLanguages = langs.map((l) => ({ code: l.code, label: l.code.toUpperCase() }));
        if (!this.translateLanguages.some((x) => x.code === this.translateSource)) {
          this.translateSource = this.translateLanguages[0]?.code ?? 'en';
        }
        if (!this.translateLanguages.some((x) => x.code === this.translateTarget)) {
          this.translateTarget = this.translateLanguages[1]?.code ?? 'fr';
        }
      },
      error: () => {
        /* garde le fallback minimal */
      },
    });
  }

  closeChat(): void {
    this.chatOpen = false;
    this.showHistoryPanel = false;
  }

  onHeaderBack(): void {
    if (this.showHistoryPanel) {
      this.showHistoryPanel = false;
      return;
    }
    this.closeChat();
  }

  toggleHistoryPanel(): void {
    this.showHistoryPanel = !this.showHistoryPanel;
    if (this.showHistoryPanel) {
      this.loadHistory();
    }
  }

  send(): void {
    const user = getSessionUser();
    const text = this.message.trim();
    if (!user || !text) return;

    this.loading = true;
    this.messages.push({ sender: 'user', content: text });
    this.message = '';

    if (this.translateMode) {
      if (this.translateSource === this.translateTarget) {
        this.messages.push({
          sender: 'bot',
          content: 'Choisis deux langues différentes (source et cible).',
        });
        this.loading = false;
        return;
      }
      this.translationService.translate(text, this.translateSource, this.translateTarget).subscribe({
        next: (res) => {
          const out = res.translatedText?.trim() || '';
          this.messages.push({
            sender: 'bot',
            content: out ? `Traduction : ${out}` : 'Aucune traduction reçue.',
          });
          this.loading = false;
        },
        error: (err: Error) => {
          this.messages.push({ sender: 'bot', content: err.message || 'Traduction indisponible.' });
          this.loading = false;
        },
      });
      return;
    }

    if (this.assistantMode === 'ai') {
      this.aiService.sendMessage(text, this.aiConversationId).subscribe({
        next: (res) => {
          this.messages.push({ sender: 'bot', content: res.reply });
          this.aiConversationId = res.conversationId;
          this.loading = false;
        },
        error: (err: Error) => {
          const msg = err.message || 'AI Assistant indisponible.';
          this.messages.push({ sender: 'bot', content: msg });
          // If cloud AI is temporarily unavailable, gracefully fallback to local rules assistant.
          this.assistantService.sendMessage(user.id, text, this.selectedLevel || undefined).subscribe({
            next: (fallback) => {
              this.messages.push({
                sender: 'bot',
                content: `Fallback assistant: ${fallback.reply}`,
              });
              this.recommendations = fallback.resources ?? [];
              if (fallback.levelUsed) this.selectedLevel = fallback.levelUsed;
              this.loading = false;
              this.refreshHistoryCount();
            },
            error: () => {
              this.loading = false;
            },
          });
        },
      });
      return;
    }

    this.assistantService.sendMessage(user.id, text, this.selectedLevel || undefined).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'bot', content: res.reply });
        this.recommendations = res.resources ?? [];
        if (res.levelUsed) this.selectedLevel = res.levelUsed;
        this.loading = false;
        this.refreshHistoryCount();
      },
      error: () => {
        this.messages.push({ sender: 'bot', content: 'Assistant is unavailable right now.' });
        this.loading = false;
      },
    });
  }

  private refreshHistoryCount(): void {
    const user = getSessionUser();
    if (!user) return;
    this.assistantService.getHistory(user.id).subscribe({
      next: (rows) => {
        this.historyCount = rows.length;
      },
      error: () => {
        this.historyCount = 0;
      },
    });
  }

  private loadHistory(): void {
    const user = getSessionUser();
    if (!user) return;
    this.historyLoading = true;
    this.assistantService.getHistory(user.id).subscribe({
      next: (rows) => {
        this.historyItems = rows;
        this.historyCount = rows.length;
        this.historyLoading = false;
      },
      error: () => {
        this.historyItems = [];
        this.historyLoading = false;
      },
    });
  }
}
