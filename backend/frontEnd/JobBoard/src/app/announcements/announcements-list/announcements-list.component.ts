import { Component, OnInit } from '@angular/core';
import { ForumService } from '../../services/forum.service';
import { Announcement } from '../../models/forum.model';

@Component({
  selector: 'app-announcements-list',
  templateUrl: './announcements-list.component.html',
  styleUrls: ['./announcements-list.component.css']
})
export class AnnouncementsListComponent implements OnInit {
  announcements: Announcement[] = [];
  loading = true;
  error = '';
  showAll = false;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.error = '';
    const obs = this.showAll
      ? this.forumService.getAnnouncements()
      : this.forumService.getActiveAnnouncements();
    obs.subscribe({
      next: (data) => {
        this.announcements = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.loadAnnouncements();
  }
}
