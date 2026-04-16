import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiConversation, AiMessage, AiService } from '../../core/services/ai.service';

/**
 * Page complète AI Assistant (remplace l’ancien widget flottant).
 * Données : microservice ai-assistant-service (AI_API_BASE). Auth : session + en-tête X-User-Id via AiService.
 */
@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant-page.component.html',
  styleUrl: './ai-assistant-page.component.scss',
})
export class AiAssistantPageComponent implements OnInit {
  conversations: AiConversation[] = [];
  messages: AiMessage[] = [];
  selectedConversationId: number | null = null;
  messageInput = '';
  /** Fichier joint (image ou PDF) pour le prochain envoi ; réinitialisé après succès. */
  selectedImage: File | null = null;
  selectedImageName = '';
  loading = false;
  errorMessage = '';

  constructor(private aiService: AiService) {}

  ngOnInit(): void {
    this.loadConversations();
  }

  /** Charge la liste des conversations de l’utilisateur connecté. */
  loadConversations(): void {
    this.aiService.getMyConversations().subscribe({
      next: (list) => {
        this.conversations = list;
        if (list.length > 0) {
          this.selectConversation(list[0]);
        }
      },
      error: (err) => (this.errorMessage = err.message),
    });
  }

  newConversation(): void {
    this.errorMessage = '';
    this.aiService.createConversation().subscribe({
      next: (c) => {
        this.conversations = [c, ...this.conversations];
        this.selectedConversationId = c.id;
        this.messages = [];
      },
      error: (err) => (this.errorMessage = err.message),
    });
  }

  selectConversation(conversation: AiConversation): void {
    this.selectedConversationId = conversation.id;
    this.errorMessage = '';
    this.aiService.getConversationMessages(conversation.id).subscribe({
      next: (msgs) => (this.messages = msgs),
      error: (err) => (this.errorMessage = err.message),
    });
  }

  /**
   * Envoie un message texte, ou image/PDF + question si un fichier est sélectionné.
   * Le backend crée une conversation si conversationId est null.
   */
  send(): void {
    this.errorMessage = '';
    const text = this.messageInput.trim();
    if (!text) {
      this.errorMessage = 'Le message est requis.';
      return;
    }
    this.loading = true;
    const call$ = this.selectedImage
      ? this.aiService.sendImageQuestion(text, this.selectedImage, this.selectedConversationId)
      : this.aiService.sendMessage(text, this.selectedConversationId);
    call$.subscribe({
      next: (res) => {
        this.selectedConversationId = res.conversationId;
        this.messageInput = '';
        this.selectedImage = null;
        this.selectedImageName = '';
        this.loading = false;
        this.refreshAfterSend();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message;
      },
    });
  }

  deleteConversation(conversationId: number): void {
    this.aiService.deleteConversation(conversationId).subscribe({
      next: () => {
        this.conversations = this.conversations.filter((c) => c.id !== conversationId);
        if (this.selectedConversationId === conversationId) {
          this.selectedConversationId = null;
          this.messages = [];
        }
      },
      error: (err) => (this.errorMessage = err.message),
    });
  }

  deleteAll(): void {
    if (!confirm("Supprimer tout l'historique AI ?")) {
      return;
    }
    this.aiService.deleteAllHistory().subscribe({
      next: () => {
        this.conversations = [];
        this.messages = [];
        this.selectedConversationId = null;
      },
      error: (err) => (this.errorMessage = err.message),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type);
    if (!ok) {
      this.selectedImage = null;
      this.selectedImageName = '';
      this.errorMessage = 'Fichier invalide. Formats acceptés: jpg, jpeg, png, pdf.';
      input.value = '';
      return;
    }
    this.selectedImage = file;
    this.selectedImageName = file.name;
  }

  /** Rafraîchit la liste et recharge les messages de la conversation courante. */
  private refreshAfterSend(): void {
    this.aiService.getMyConversations().subscribe({
      next: (list) => {
        this.conversations = list;
        if (this.selectedConversationId) {
          const selected = list.find((c) => c.id === this.selectedConversationId);
          if (selected) {
            this.selectConversation(selected);
          }
        }
      },
      error: (err) => (this.errorMessage = err.message),
    });
  }

  formatDate(v: string): string {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
  }
}
