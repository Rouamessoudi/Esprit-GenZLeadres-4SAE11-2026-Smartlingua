import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AssistantResource,
  EnglishAssistantService,
} from '../../core/services/english-assistant.service';
import { getSessionUser } from '../../core/services/local-session.service';

@Component({
  selector: 'app-english-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './english-assistant-page.component.html',
  styleUrl: './english-assistant-page.component.scss',
})
export class EnglishAssistantPageComponent implements OnInit {
  message = '';
  selectedLevel = '';
  loading = false;
  errorMessage = '';
  userId: number | null = null;

  messages: Array<{ sender: 'user' | 'bot'; content: string }> = [];
  recommendations: AssistantResource[] = [];
  history: Array<{ id: number; message: string; response: string; level: string; createdAt: string }> = [];
  saveFeedback: Record<number, string> = {};

  readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  constructor(private assistantService: EnglishAssistantService) {}

  ngOnInit(): void {
    const user = getSessionUser();
    this.userId = user?.id ?? null;
    if (this.userId) {
      this.loadHistory();
    } else {
      this.errorMessage = 'Please login to use English Assistant.';
    }
  }

  send(): void {
    if (!this.userId || !this.message.trim()) {
      return;
    }
    this.errorMessage = '';
    const text = this.message.trim();
    this.messages.push({ sender: 'user', content: text });
    this.message = '';
    this.loading = true;

    this.assistantService.sendMessage(this.userId, text, this.selectedLevel || undefined).subscribe({
      next: (res) => {
        this.messages.push({ sender: 'bot', content: res.reply });
        this.recommendations = res.resources ?? [];
        if (res.levelUsed) {
          this.selectedLevel = res.levelUsed;
        }
        if (res.levelRequired) {
          this.errorMessage = 'Choose your level first (A1 to C2), then ask again.';
        }
        this.loading = false;
        this.loadHistory();
      },
      error: () => {
        this.errorMessage = 'Assistant is unavailable right now.';
        this.loading = false;
      },
    });
  }

  saveResource(resourceId: number): void {
    if (!this.userId) {
      return;
    }
    this.assistantService.saveResource(this.userId, resourceId).subscribe({
      next: () => {
        this.saveFeedback[resourceId] = 'Saved';
      },
      error: () => {
        this.saveFeedback[resourceId] = 'Save failed';
      },
    });
  }

  private loadHistory(): void {
    if (!this.userId) return;
    this.assistantService.getHistory(this.userId).subscribe({
      next: (rows) => {
        this.history = rows;
      },
      error: () => {
        this.history = [];
      },
    });
  }
}
