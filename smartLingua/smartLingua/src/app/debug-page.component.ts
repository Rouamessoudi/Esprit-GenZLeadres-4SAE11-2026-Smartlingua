import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Page de diagnostic : pas de guard, pas de dépendance.
 * Si /debug s'affiche → problème sur la route par défaut ou un composant.
 * Si /debug ne s'affiche pas → problème bootstrap ou routing de base.
 */
@Component({
  selector: 'app-debug-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="padding:2rem;font-family:sans-serif;">
      <h1 style="color:#00b894;">DEBUG OK</h1>
      <p>Le routing et le bootstrap Angular fonctionnent.</p>
      <a routerLink="/" style="color:#6C5CE7;">← Retour accueil</a>
    </div>
  `,
})
export class DebugPageComponent {}
