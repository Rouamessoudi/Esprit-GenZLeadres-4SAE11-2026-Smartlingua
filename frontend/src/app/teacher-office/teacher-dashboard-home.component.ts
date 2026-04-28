import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-teacher-dashboard-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cards">
      <a class="card" routerLink="/teacher/courses">
        <span class="material-icons-round">menu_book</span>
        <h3>Mes cours</h3>
        <p>Voir et gerer mes cours existants.</p>
      </a>
      <a class="card" routerLink="/teacher/courses/new">
        <span class="material-icons-round">add_circle</span>
        <h3>Ajouter cours</h3>
        <p>Creer un nouveau cours et son contenu.</p>
      </a>
      <a class="card" routerLink="/teacher/students">
        <span class="material-icons-round">group</span>
        <h3>Mes etudiants</h3>
        <p>Consulter la liste des etudiants.</p>
      </a>
      <a class="card" routerLink="/teacher/messaging">
        <span class="material-icons-round">chat</span>
        <h3>Messaging</h3>
        <p>Discuter avec les etudiants.</p>
      </a>
      <a class="card" routerLink="/teacher/forum">
        <span class="material-icons-round">forum</span>
        <h3>Forum</h3>
        <p>Suivre et animer les discussions.</p>
      </a>
      <a class="card" routerLink="/teacher/announcements">
        <span class="material-icons-round">campaign</span>
        <h3>Annonces</h3>
        <p>Publier et gerer les annonces.</p>
      </a>
      <a class="card" routerLink="/teacher/notifications">
        <span class="material-icons-round">notifications</span>
        <h3>Notifications</h3>
        <p>Voir les alertes et activites recentes.</p>
      </a>
    </section>
  `,
  styleUrl: '../front-office/dashboard/student-dashboard-home.component.scss'
})
export class TeacherDashboardHomeComponent {}
