import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="placeholder">
      <span class="material-icons-round">{{ icon() }}</span>
      <h2>{{ title() }}</h2>
      <p>
        This module page is connected to routing and ready for integration with the
        corresponding microservice frontend features.
      </p>
      <a routerLink="/dashboard">Back to Dashboard</a>
    </section>
  `,
  styles: [`
    .placeholder {
      background: #fff;
      border: 1px solid #e6ebff;
      border-radius: 14px;
      padding: 24px;
      text-align: center;
      color: #21305f;
    }
    .placeholder .material-icons-round {
      font-size: 42px;
      color: #1d49ce;
    }
    .placeholder p {
      color: #617099;
      max-width: 600px;
      margin: 8px auto 16px;
    }
    .placeholder a {
      color: #1d49ce;
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class ModulePlaceholderComponent {
  private route = inject(ActivatedRoute);

  title = computed(() => this.route.snapshot.data['title'] ?? 'Module');
  icon = computed(() => this.route.snapshot.data['icon'] ?? 'widgets');
}
