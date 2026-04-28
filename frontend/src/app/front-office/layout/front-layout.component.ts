import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
    selector: 'app-front-layout',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, FooterComponent],
    template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
    styles: [`
    .main-content {
      padding-top: 72px;
      min-height: 100vh;
    }
  `]
})
export class FrontLayoutComponent { }
