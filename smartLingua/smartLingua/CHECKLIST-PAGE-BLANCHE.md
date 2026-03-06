# Checklist – Page blanche résolue

## Cause(s) identifiée(s)

1. **Lazy load de la route par défaut** : Les composants `FrontLayoutComponent` et `HomeComponent` étaient chargés via `loadComponent(() => import(...))`. En cas d’échec du chargement du chunk (réseau, cache, chemin), la zone principale restait vide → page blanche.
2. **Aucune visibilité sur les erreurs** : Pas d’`ErrorHandler` global, donc une erreur runtime (ex. après bootstrap) n’était pas affichée → diagnostic difficile.

## Correctifs appliqués

- **Route par défaut en eager** : `path: ''` utilise maintenant `component: FrontLayoutComponent` et l’enfant `path: ''` utilise `component: HomeComponent`, avec import statique en tête de `app.routes.ts`. Plus de lazy load pour la première page → pas de dépendance au chargement dynamique du chunk.
- **ErrorHandler global** : `GlobalErrorHandler` enregistre les erreurs en console et affiche une bannière rouge en bas de page en cas d’erreur non gérée.
- **Route /debug** : Route sans guard qui affiche « DEBUG OK » pour vérifier que le bootstrap et le routing fonctionnent.

## Fichiers modifiés

| Fichier | Modification |
|--------|---------------|
| `app/app.routes.ts` | Import de `FrontLayoutComponent` et `HomeComponent` ; route `''` en `component` (eager) ; route `debug` ajoutée. |
| `app/app.config.ts` | Ajout de `{ provide: ErrorHandler, useClass: GlobalErrorHandler }`. |
| `app/global-error-handler.ts` | Nouveau : log console + bannière visible en bas de page. |
| `app/debug-page.component.ts` | Nouveau : page de test affichant « DEBUG OK ». |

## Checklist de validation

- [ ] `npm install` (si besoin)
- [ ] `ng serve` sans erreur dans le terminal
- [ ] `ng build` sans erreur
- [ ] Ouvrir http://localhost:4200 → la page d’accueil s’affiche (navbar + hero + contenu)
- [ ] Ouvrir http://localhost:4200/debug → « DEBUG OK » s’affiche
- [ ] Cliquer sur « Sign In » → page login
- [ ] Se connecter (backend 8092 démarré) → redirection vers /chat
- [ ] Page Chat accessible (sidebar + zone messages)
- [ ] Si une erreur apparaît : bannière rouge en bas avec le message (et détail en console)

## Tests à lancer

```bash
cd c:\pi\smartLingua\smartLingua
npm install
ng build --configuration=development
ng serve
```

Puis dans le navigateur :

1. http://localhost:4200 → page d’accueil visible  
2. http://localhost:4200/debug → « DEBUG OK »  
3. Login → Chat accessible  
