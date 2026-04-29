import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MessagingApiService, MessagingConversationDto, MessagingMessageDto } from '../../core/services/messaging-api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-messaging-supervision',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <header class="head">
        <h2>Admin Messaging Supervision</h2>
        <p>Supervision des discussions entre enseignants et etudiants (lecture + moderation).</p>
      </header>

      <p class="error" *ngIf="error">{{ error }}</p>
      <p class="error" *ngIf="!isAdmin">Acces reserve a l'admin.</p>

      <div class="shell" *ngIf="isAdmin">
        <aside class="left">
          <h3>Conversations</h3>
          <button type="button" class="refresh" (click)="loadConversations()">Rafraichir</button>
          <ul>
            <li
              *ngFor="let c of conversations"
              [class.active]="selectedConversation?.id === c.id"
              (click)="selectConversation(c)"
            >
              <strong>{{ c.teacherName }} ↔ {{ c.studentName }}</strong>
              <p>{{ c.lastMessagePreview || 'Aucun message' }}</p>
            </li>
          </ul>
        </aside>

        <article class="right">
          <h3 *ngIf="selectedConversation; else emptyTitle">
            {{ selectedConversation.teacherName }} ↔ {{ selectedConversation.studentName }}
          </h3>
          <ng-template #emptyTitle><h3>Selectionne une conversation</h3></ng-template>

          <div class="messages">
            <article class="msg" *ngFor="let m of messages">
              <p>{{ m.content }}</p>
              <small>{{ m.createdAt | date:'short' }}</small>
              <button type="button" class="danger" (click)="deleteMessage(m.id)">Supprimer</button>
            </article>
            <p class="empty" *ngIf="selectedConversation && messages.length === 0">Aucun message.</p>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page { border:1px solid #e6ebff; border-radius:12px; background:#fff; padding:14px; }
    .head h2 { margin:0; color:#1e2d5a; }
    .head p { margin:4px 0 12px; color:#64739b; }
    .error { margin:0 0 10px; color:#b00020; }
    .shell { display:grid; grid-template-columns: 320px 1fr; gap:12px; min-height: 500px; }
    .left { border-right:1px solid #edf0ff; padding-right:10px; }
    .left h3, .right h3 { margin:0 0 10px; color:#283767; }
    .refresh { border:1px solid #cad4ff; background:#fff; color:#4b5aa0; border-radius:8px; padding:6px 10px; margin-bottom:10px; }
    ul { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
    li { border:1px solid #e6ebff; border-radius:10px; padding:10px; cursor:pointer; }
    li.active { border-color:#9da8ff; background:#f5f6ff; }
    li p { margin:6px 0 0; color:#6f7aa0; font-size:12px; }
    .messages { display:grid; gap:8px; }
    .msg { border:1px solid #e8ecff; border-radius:10px; padding:10px; background:#fafbff; }
    .msg p { margin:0 0 8px; color:#2d3d70; }
    .msg small { color:#8f99bc; margin-right:8px; }
    .danger { border:1px solid #d66d5f; color:#d66d5f; background:#fff; border-radius:8px; padding:4px 10px; }
    .empty { color:#6f7aa0; }
  `]
})
export class AdminMessagingSupervisionComponent implements OnInit {
  isAdmin = false;
  error = '';
  conversations: MessagingConversationDto[] = [];
  selectedConversation: MessagingConversationDto | null = null;
  messages: MessagingMessageDto[] = [];

  constructor(private messagingApi: MessagingApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      return;
    }
    this.loadConversations();
  }

  loadConversations(): void {
    this.error = '';
    this.messagingApi.getAdminConversations().subscribe({
      next: (rows) => {
        this.conversations = rows ?? [];
        if (this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        } else {
          this.selectedConversation = null;
          this.messages = [];
        }
      },
      error: () => {
        this.error = 'Impossible de charger les conversations de supervision admin.';
      }
    });
  }

  selectConversation(conversation: MessagingConversationDto): void {
    this.selectedConversation = conversation;
    this.error = '';
    this.messagingApi.getAdminConversationMessages(conversation.teacherId, conversation.studentId).subscribe({
      next: (rows) => {
        this.messages = rows ?? [];
      },
      error: () => {
        this.error = 'Impossible de charger les messages de cette conversation.';
        this.messages = [];
      }
    });
  }

  deleteMessage(messageId: number): void {
    this.error = '';
    this.messagingApi.deleteAdminMessage(messageId).subscribe({
      next: () => {
        this.messages = this.messages.filter((m) => m.id !== messageId);
      },
      error: () => {
        this.error = 'Suppression impossible.';
      }
    });
  }
}
