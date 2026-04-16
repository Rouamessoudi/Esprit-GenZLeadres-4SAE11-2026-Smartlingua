import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ForumListComponent } from './forum/forum-list/forum-list.component';
import { ForumDetailComponent } from './forum/forum-detail/forum-detail.component';
import { ForumFormComponent } from './forum/forum-form/forum-form.component';
import { AnnouncementsListComponent } from './announcements/announcements-list/announcements-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/forum', pathMatch: 'full' },
  { path: 'forum', component: ForumListComponent },
  { path: 'forum/new', component: ForumFormComponent },
  { path: 'forum/:id', component: ForumDetailComponent },
  { path: 'announcements', component: AnnouncementsListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
