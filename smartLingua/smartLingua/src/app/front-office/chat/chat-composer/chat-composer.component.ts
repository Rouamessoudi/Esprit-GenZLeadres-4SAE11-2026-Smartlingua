import { Component, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="composer" (ngSubmit)="send()">
      <input
        #fileInput
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        class="file-input-hidden"
        (change)="onFileSelected($event)"
      />
      <button type="button" class="btn-icon" (click)="fileInput.click()" aria-label="Ajouter une pièce jointe (image ou fichier)">
        <span class="material-icons-round">add_circle_outline</span>
      </button>
      <textarea
        #inputRef
        class="input"
        [(ngModel)]="content"
        name="content"
        [placeholder]="placeholder"
        [disabled]="disabled"
        (keydown)="onKeydown($event)"
        rows="1"
        aria-label="Écrire un message"
      ></textarea>
      <button type="button" class="btn-icon" (click)="emoji.emit()" aria-label="Emoji">
        <span class="material-icons-round">emoji_emotions_outlined</span>
      </button>
      <button type="submit" class="btn-send" [disabled]="(!content.trim() && !pendingFiles.length) || disabled" aria-label="Envoyer">
        <span class="material-icons-round">send</span>
      </button>
    </form>
    @if (pendingFiles.length > 0) {
      <div class="attachments-preview">
        @for (f of pendingFiles; track f.name + f.size) {
          <span class="attachments-item">
            @if (isImage(f)) {
              <img [src]="getPreview(f)" alt="" class="thumb" />
            } @else {
              <span class="material-icons-round">insert_drive_file</span>
            }
            <span class="attachments-name">{{ f.name }}</span>
            <button type="button" class="btn-remove" (click)="removeFile(f)" aria-label="Retirer">×</button>
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .file-input-hidden { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
    .composer {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-card);
    }
.input {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 22px;
  font-size: 0.95rem;
  background: var(--bg);
  color: var(--text);
  transition: var(--transition);
  resize: none;
  font-family: inherit;
}
    .input::placeholder { color: var(--text-muted); }
    .input:focus {
      border-color: var(--primary);
      outline: none;
      box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.15);
    }
    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 50%;
      transition: var(--transition);
    }
    .btn-icon:hover { color: var(--primary); background: rgba(108, 92, 231, 0.08); }
    .btn-icon .material-icons-round { font-size: 24px; }
    .btn-send {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      background: var(--primary);
      color: #fff;
      cursor: pointer;
      border-radius: 50%;
      transition: var(--transition);
    }
    .btn-send:hover:not(:disabled) {
      background: var(--primary-dark);
      box-shadow: var(--shadow-primary);
    }
    .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-send .material-icons-round { font-size: 22px; }
    .attachments-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 8px;
      background: var(--bg-card);
    }
    .attachments-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 0.8rem;
      color: var(--text);
    }
    .attachments-item .thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; }
    .attachments-item .material-icons-round { font-size: 20px; color: var(--text-muted); }
    .attachments-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-remove {
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.2rem;
      line-height: 1;
      padding: 0 2px;
    }
    .btn-remove:hover { color: var(--primary); }
  `],
})
export class ChatComposerComponent {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLTextAreaElement>;
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendAttachments = new EventEmitter<File[]>();
  @Output() emoji = new EventEmitter<void>();
  @Output() attach = new EventEmitter<void>();

  @Input() placeholder = 'Écris un message...';
  @Input() disabled = false;

  content = '';
  pendingFiles: File[] = [];
  private previews = new Map<File, string>();

  send(): void {
    if (this.pendingFiles.length > 0) {
      this.sendAttachments.emit([...this.pendingFiles]);
      this.pendingFiles = [];
      this.previews.clear();
      return;
    }
    const text = this.content.trim();
    if (!text) return;
    this.content = '';
    this.sendMessage.emit(text);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    const fileList = Array.from(files);
    const hasImage = fileList.some((f) => this.isImage(f));
    if (hasImage) {
      this.sendAttachments.emit(fileList);
      input.value = '';
      return;
    }
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!this.pendingFiles.some((x) => x.name === f.name && x.size === f.size)) {
        this.pendingFiles.push(f);
        if (this.isImage(f)) {
          const reader = new FileReader();
          reader.onload = () => this.previews.set(f, reader.result as string);
          reader.readAsDataURL(f);
        }
      }
    }
    input.value = '';
  }

  isImage(file: File): boolean {
    return (file.type || '').startsWith('image/');
  }

  getPreview(file: File): string {
    return this.previews.get(file) ?? '';
  }

  removeFile(file: File): void {
    this.pendingFiles = this.pendingFiles.filter((f) => f !== file);
    this.previews.delete(file);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }
}
