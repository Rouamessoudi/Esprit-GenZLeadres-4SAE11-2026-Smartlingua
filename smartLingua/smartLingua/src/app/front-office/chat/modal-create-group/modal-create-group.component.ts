import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDTO } from '../../../core/services/messaging.service';

@Component({
  selector: 'app-modal-create-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-create-group.component.html',
  styleUrl: './modal-create-group.component.scss',
})
export class ModalCreateGroupComponent {
  @Input() users: UserDTO[] = [];
  @Input() currentUserId = 0;
  @Input() loading = false;

  @Output() create = new EventEmitter<{ name: string; memberIds: number[] }>();
  @Output() cancel = new EventEmitter<void>();

  groupName = '';
  selectedIds = new Set<number>();
  search = '';

  get selectableUsers(): UserDTO[] {
    return this.users.filter((u) => u.id !== this.currentUserId);
  }

  filteredUsers(): UserDTO[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.selectableUsers;
    return this.selectableUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  toggle(userId: number): void {
    if (this.selectedIds.has(userId)) {
      this.selectedIds.delete(userId);
    } else {
      this.selectedIds.add(userId);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  isSelected(userId: number): boolean {
    return this.selectedIds.has(userId);
  }

  onSubmit(): void {
    const name = this.groupName.trim();
    if (!name || this.selectedIds.size === 0) return;
    this.create.emit({ name, memberIds: Array.from(this.selectedIds) });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel.emit();
    }
  }
}
