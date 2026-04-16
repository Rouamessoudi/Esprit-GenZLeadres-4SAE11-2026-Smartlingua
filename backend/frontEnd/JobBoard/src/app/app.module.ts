import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ForumListComponent } from './forum/forum-list/forum-list.component';
import { ForumDetailComponent } from './forum/forum-detail/forum-detail.component';
import { ForumFormComponent } from './forum/forum-form/forum-form.component';
import { AnnouncementsListComponent } from './announcements/announcements-list/announcements-list.component';

@NgModule({
  declarations: [
    AppComponent,
    ForumListComponent,
    ForumDetailComponent,
    ForumFormComponent,
    AnnouncementsListComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
