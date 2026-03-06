import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ConversationDTO,
  UserDTO,
  InvitationDTO,
} from '../../../core/services/messaging.service';
import { PresenceService } from '../../../core/services/presence.service';

export type ChatTab = 'all' | 'private' | 'groups' | 'invitations';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss',
})
export class ChatSidebarComponent {
  @Input() currentUserId = 0;
  @Input() users: UserDTO[] = [];
  @Input() conversations: ConversationDTO[] = [];
  @Input() selectedConversation: ConversationDTO | null = null;
  @Input() showUserList = false;
  @Input() usersLoaded = false;
  @Input() convsLoaded = false;
  @Input() activeTab: ChatTab = 'all';
  @Input() pendingInvitations: InvitationDTO[] = [];
  @Input() pendingInvitationsCount = 0;
  /** Ids des utilisateurs à qui l’utilisateur connecté a déjà envoyé une invitation (affiche icône succès) */
  @Input() sentInvitationToUserIds: number[] = [];

  @Output() tabChange = new EventEmitter<ChatTab>();
  @Output() createGroup = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<ConversationDTO>();
  @Output() startConversation = new EventEmitter<UserDTO>();
  @Output() openChatWithUser = new EventEmitter<UserDTO>();
  @Output() toggleUserList = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() acceptInvitation = new EventEmitter<InvitationDTO>();
  @Output() rejectInvitation = new EventEmitter<InvitationDTO>();
  @Output() sendInvitation = new EventEmitter<UserDTO>();
  @Output() startCall = new EventEmitter<{ user: UserDTO; video: boolean }>();

  search = '';

  constructor(public presence: PresenceService) {}

  getOtherUser(c: ConversationDTO): UserDTO | undefined {
    const otherId =
      c.participant1Id === this.currentUserId ? c.participant2Id : c.participant1Id;
    return this.users.find((x) => x.id === otherId);
  }

  getOtherName(c: ConversationDTO): string {
    const u = this.getOtherUser(c);
    return u ? u.username : 'Utilisateur #' + (c.participant1Id === this.currentUserId ? c.participant2Id : c.participant1Id);
  }

  formatTime(ts: string | undefined): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Hier';
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    } catch {
      return '';
    }
  }

  onSearch(): void {
    this.searchChange.emit(this.search.trim());
  }

  filteredConversations(): ConversationDTO[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.conversations;
    return this.conversations.filter((c) => {
      const name = this.getOtherName(c).toLowerCase();
      const preview = (this.conversations.find(x => x.id === c.id)?.lastMessagePreview || '').toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }

  filteredUsers(): UserDTO[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.users.filter((u) => u.id !== this.currentUserId);
    return this.users.filter(
      (u) =>
        u.id !== this.currentUserId &&
        (u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }

  getSenderName(inv: InvitationDTO): string {
    const u = this.users.find((x) => x.id === inv.senderId);
    return u ? u.username : 'Utilisateur #' + inv.senderId;
  }

  formatInvitationDate(ts: string | undefined | unknown): string {
    if (ts == null) return '';
    const s = typeof ts === 'string' ? ts : String(ts);
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  }
}
