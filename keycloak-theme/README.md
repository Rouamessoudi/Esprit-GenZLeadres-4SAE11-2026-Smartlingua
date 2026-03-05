# Thème Keycloak SmartLingua

Ce dossier contient un thème Keycloak pour les pages **Login** et **Register**, aux couleurs de l'application SmartLingua (violet #6C5CE7, fond clair, même police).

## Installation

1. **Copier le thème dans Keycloak**  
   - Ouvre le dossier d’installation de Keycloak (là où tu as lancé `kc.bat start-dev`).  
   - À la racine, il doit y avoir un dossier **`themes`**.  
   - Copie le dossier **`smartlingua`** (contenant `login/`) **dans** `themes/`.  
   - Résultat : `keycloak/themes/smartlingua/login/...`

2. **Activer le thème dans Keycloak**  
   - Ouvre **http://localhost:8081/admin**  
   - Connecte-toi, sélectionne le realm **smartlingua**  
   - Va dans **Realm settings** → onglet **Themes**  
   - Dans **Login theme**, choisis **smartlingua**  
   - Clique sur **Save**

3. **Vérifier**  
   - Ouvre **http://localhost:4200** → clique sur **Sign In**  
   - La page de connexion Keycloak doit s’afficher avec le fond clair et les boutons violets (thème SmartLingua).

## Désactiver le cache (en développement)

Pour modifier le CSS sans redémarrer Keycloak à chaque fois, lance Keycloak avec :

```bat
bin\kc.bat start-dev --http-port 8081 --spi-theme-static-max-age=-1 --spi-theme-cache-themes=false --spi-theme-cache-templates=false
```

Pense à enlever ces options en production.

## Structure

```
smartlingua/
  login/
    theme.properties    → étend le thème keycloak, charge login.css
    resources/
      css/
        login.css       → couleurs et style SmartLingua
```
