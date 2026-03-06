import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ConversationDTO,
  UserDTO,
  MessageDTO,
} from '../../../core/services/messaging.service';
import { PresenceService } from '../../../core/services/presence.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ChatComposerComponent } from '../chat-composer/chat-composer.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, ChatComposerComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
})
export class ChatWindowComponent {
  @Input() currentUserId = 0;
  @Input() users: UserDTO[] = [];
  @Input() selectedConversation: ConversationDTO | null = null;
  @Input() messages: MessageDTO[] = [];
  @Input() sending = false;
  /** True si l'utilisateur actuel a bloqué l'autre (pour afficher Bloquer / Débloquer) */
  @Input() isOtherBlocked = false;

  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendAttachments = new EventEmitter<File[]>();
  @Output() startCall = new EventEmitter<{ user: UserDTO; video: boolean }>();
  @Output() openInfo = new EventEmitter<void>();
  @Output() blockUser = new EventEmitter<number>();

  menuOpen = false;

  constructor(public presence: PresenceService) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen = false;
  }

  getOtherUser(c: ConversationDTO): UserDTO | undefined {
    const otherId =
      c.participant1Id === this.currentUserId ? c.participant2Id : c.participant1Id;
    return this.users.find((x) => x.id === otherId);
  }

  getOtherName(c: ConversationDTO): string {
    const u = this.getOtherUser(c);
    return u ? u.username : 'Utilisateur #' + (c.participant1Id === this.currentUserId ? c.participant2Id : c.participant1Id);
  }

  onAudioCall(): void {
    const user = this.selectedConversation ? this.getOtherUser(this.selectedConversation) : undefined;
    if (user) this.startCall.emit({ user, video: false });
  }

  onVideoCall(): void {
    const user = this.selectedConversation ? this.getOtherUser(this.selectedConversation) : undefined;
    if (user) this.startCall.emit({ user, video: true });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onBlockClick(): void {
    if (!this.selectedConversation) return;
    const otherId = this.selectedConversation.participant1Id === this.currentUserId
      ? this.selectedConversation.participant2Id
      : this.selectedConversation.participant1Id;
    this.blockUser.emit(otherId);
    this.menuOpen = false;
  }

  isGroup(): boolean {
    return false;
  }

  memberCount(): number {
    return 2;
  }
}
