import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageDTO } from '../../../core/services/messaging.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bubble" [class.sent]="isSent">
      @if (isImageContent(message.content)) {
        <img [src]="message.content" alt="Image" class="bubble-image" />
      } @else {
        <span class="content">{{ message.content }}</span>
      }
      <span class="meta">
        <span class="time">{{ formatTime(message.timestamp) }}</span>
        @if (isSent && message.isRead) {
          <span class="seen" aria-label="Lu">
            <span class="material-icons-round">done_all</span>
          </span>
        }
      </span>
    </div>
  `,
  styles: [`
    .bubble {
      max-width: 75%;
      width: fit-content;
      padding: 10px 14px;
      border-radius: 16px 16px 16px 4px;
      background: var(--bg);
      border: 1px solid var(--border);
      align-self: flex-start;
      margin-right: auto;
    }
    .bubble.sent {
      border-radius: 16px 16px 4px 16px;
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      align-self: flex-end;
      margin-left: auto;
      margin-right: 0;
    }
    .bubble-image {
      display: block;
      max-width: 100%;
      max-height: 240px;
      border-radius: 8px;
    }
    .content {
      display: block;
      font-size: 0.95rem;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
    }
    .time {
      font-size: 0.7rem;
      opacity: 0.85;
    }
    .seen .material-icons-round {
      font-size: 14px;
      opacity: 0.9;
    }
  `],
})
export class MessageBubbleComponent {
  @Input() message!: MessageDTO;
  @Input() currentUserId = 0;

  get isSent(): boolean {
    return this.message.senderId === this.currentUserId;
  }

  isImageContent(content: string): boolean {
    return typeof content === 'string' && content.startsWith('data:image/');
  }

  formatTime(ts: string): string {
    try {
      return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
