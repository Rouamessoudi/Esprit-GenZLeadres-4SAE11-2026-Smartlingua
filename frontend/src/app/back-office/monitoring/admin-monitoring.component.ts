import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { forumGatewayPrefix } from '../../core/api-gateway-urls';

@Component({
  selector: 'app-admin-monitoring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="monitoring">
      <h2>Monitoring Admin</h2>
      <p>Vue d'administration pour verifier la sante et les metriques des services.</p>

      <div class="cards">
        <a class="card" [href]="healthUrl" target="_blank" rel="noopener noreferrer">
          <h3>Health</h3>
          <p>Verifier l'etat global des microservices.</p>
        </a>
        <a class="card" [href]="metricsUrl" target="_blank" rel="noopener noreferrer">
          <h3>Metrics</h3>
          <p>Consulter les metriques runtime exposees.</p>
        </a>
        <a class="card" [href]="prometheusUrl" target="_blank" rel="noopener noreferrer">
          <h3>Prometheus</h3>
          <p>Exporter les metriques pour supervision externe.</p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .monitoring { background: #fff; border: 1px solid #e6ebff; border-radius: 14px; padding: 18px; }
    h2 { margin: 0 0 6px; color: #1e2d5a; }
    p { margin: 0 0 16px; color: #657399; }
    .cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .card { text-decoration: none; border: 1px solid #dce4ff; border-radius: 10px; padding: 12px; color: inherit; background: #fafcff; }
    .card h3 { margin: 0 0 6px; color: #2b3d73; }
    .card p { margin: 0; color: #5f6f98; }
  `]
})
export class AdminMonitoringComponent {
  healthUrl = `${forumGatewayPrefix()}/actuator/health`;
  metricsUrl = `${forumGatewayPrefix()}/actuator/metrics`;
  prometheusUrl = `${forumGatewayPrefix()}/actuator/prometheus`;
}
