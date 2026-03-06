# Étapes pour pousser la branche feature/messaging sur GitHub

## Ce qui est déjà fait
- Dépôt Git initialisé dans `c:\pi`
- Commit créé avec toute la partie messaging (backend + frontend SmartLingua)
- Branche **feature/messaging** créée et active

---

## À faire de ton côté (dans l’ordre)

### 1. Récupérer l’URL de ton dépôt GitHub
- Ouvre ton dépôt sur GitHub dans Edge (celui où tu as `main`, `feature/courses`, etc.).
- Clique sur le bouton vert **Code**.
- Copie l’URL (HTTPS), par exemple : `https://github.com/TON_USER/TON_REPO.git`

### 2. Ajouter le remote et pousser
Ouvre **PowerShell** ou **Invite de commandes** dans `c:\pi` puis exécute :

```bash
cd c:\pi

REM Remplace par l’URL de TON dépôt GitHub :
git remote add origin https://github.com/TON_USER/TON_REPO.git

REM Pousser la branche feature/messaging (pas main) :
git push -u origin feature/messaging
```

- Si on te demande de te connecter, utilise ton compte GitHub (Edge peut s’ouvrir pour l’auth).
- Si le dépôt existe déjà et a déjà des commits, tu peux avoir une erreur. Dans ce cas :

  **Option A – Premier push de ce projet vers ce repo :**
  ```bash
  git push -u origin feature/messaging
  ```
  Si Git refuse à cause de l’historique différent, tu peux forcer (attention, à n’utiliser que si tu es sûr que c’est la bonne branche) :
  ```bash
  git push -u origin feature/messaging --force
  ```

  **Option B – Le repo a déjà du code (ex. main avec feature/courses) :**  
  Il faudra soit créer un **nouveau dépôt** vide sur GitHub pour ce projet, soit faire un merge/rebase avec l’existant. Dis-moi si tu es dans ce cas.

### 3. Vérifier sur GitHub
- Va sur la page du dépôt.
- Ouvre le sélecteur de branches (où il y a "main").
- Tu dois voir **feature/messaging**.
- Clique dessus : les fichiers du projet (messaging, SmartLingua, etc.) doivent s’afficher.

---

## Si tout va bien
- La branche **feature/messaging** apparaît sur GitHub.
- Elle contient tout le projet (backend messaging, frontend chat, auth, CORS, scripts).
- Tu peux ensuite créer une **Pull Request** de `feature/messaging` vers `main` si tu veux fusionner plus tard.

---

## Personnaliser ton identité Git (optionnel)
Pour que les prochains commits aient ton nom/email partout :

```bash
git config --global user.email "ton@email.com"
git config --global user.name "Ton Nom"
```

Pour ce dépôt uniquement, c’est déjà configuré en local avec `majd2@gmail.com` / "SmartLingua Dev". Tu peux le modifier avec :

```bash
cd c:\pi
git config user.email "ton@email.com"
git config user.name "Ton Nom"
```
