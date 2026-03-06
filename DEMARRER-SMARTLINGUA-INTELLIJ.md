# Démarrer SmartLingua depuis IntelliJ (A jusqu'à Z)

## 1. Ouvrir le projet dans IntelliJ

1. **Lance IntelliJ IDEA.**
2. **File → Open** (ou **Open** sur l’écran d’accueil).
3. Choisis le dossier :
   ```
   c:\pi\backend\backend\backEnd
   ```
4. Clique sur **OK**. IntelliJ charge le projet (module Maven / microservices).
5. Attends la fin de l’indexation et l’import Maven (barre de progression en bas).

---

## 2. Base de données (Backend)

Le backend **Messaging** (port **8092**) utilise **MySQL** par défaut.

### Option A : MySQL

1. Démarre **MySQL** (XAMPP, WAMP, ou service Windows).
2. Ouvre **phpMyAdmin** (ou MySQL en ligne de commande) et crée la base :
   ```sql
   CREATE DATABASE smartlingua_messaging;
   ```
3. Dans `backend\backend\backEnd\microservices\messaging\src\main\resources\application.properties` :
   - `spring.datasource.username=root`
   - `spring.datasource.password=` (vide si pas de mot de passe)

### Option B : H2 (sans MySQL)

Si tu n’as pas MySQL, utilise le profil **dev** (H2 en mémoire) :

- Dans IntelliJ, lance la config **« SmartLingua - Backend (Dev H2) »** au lieu de **« SmartLingua - Backend (MySQL) »**.

---

## 3. Lancer l’application complète depuis IntelliJ

### Méthode 1 : Tout en un (Backend + Frontend)

1. En haut à droite, ouvre la liste des **Run Configurations** (menu déroulant).
2. Choisis **« SmartLingua - App (Backend + Frontend) »**.
3. Clique sur le bouton **Run** (triangle vert) ou **Debug** (insecte).
4. IntelliJ démarre :
   - le **backend** Spring Boot (messaging sur le port **8092**) ;
   - le **frontend** Angular (`ng serve`).

Quand tu vois dans la console du backend quelque chose comme :
`Started MessagingApplication in X seconds`  
et pour le frontend :  
`Local: http://localhost:4200/` (ou un autre port si 4200 est pris), c’est prêt.

### Méthode 2 : Backend puis Frontend séparément

1. Lance **« SmartLingua - Backend (MySQL) »** (ou **Backend (Dev H2)**).
2. Attends le message `Started MessagingApplication`.
3. Lance **« SmartLingua - Frontend »**.
4. Quand tu vois `Local: http://localhost:4200/`, ouvre ce lien dans le navigateur.

---

## 4. Vérifier que tout tourne

| Service        | URL / Port        | Rôle |
|----------------|-------------------|------|
| Frontend       | http://localhost:4200/ | Angular (page d’accueil, login, chat) |
| Backend API    | http://localhost:8092  | Auth, utilisateurs, messages, WebSocket |

- Ouvre **http://localhost:4200/** dans Chrome/Edge.
- Tu dois voir la page d’accueil SmartLingua (navbar, hero, etc.).

---

## 5. Tester les fonctionnalités (A jusqu’à Z)

### 1) Page d’accueil

- **http://localhost:4200/**  
- Navbar : Home, Courses, Chat, Features, About, Sign In.

### 2) Inscription

- Clique **Sign In** → **Créer un compte** (ou va sur **http://localhost:4200/register**).
- Remplis : nom d’utilisateur, email, mot de passe, rôle (Étudiant / Enseignant).
- Valide → redirection vers le **Chat** après succès.

### 3) Connexion

- **http://localhost:4200/login**
- Email + mot de passe → **Se connecter** → redirection vers le **Chat**.

### 4) Chat (messagerie)

- **http://localhost:4200/chat** (ou lien **Chat** dans la navbar une fois connecté).
- Sidebar : onglets **Tous / Privé / Groupes / Invitations**.
- Liste des conversations, liste des utilisateurs.
- Cliquer sur une conversation → zone de messages à droite.
- Envoyer des messages, **Inviter** un utilisateur, accepter/refuser des invitations.

### 5) Appels audio / vidéo (WebRTC)

- Dans le Chat, à côté d’un utilisateur : boutons **Audio** et **Vidéo**.
- Cliquer ouvre le modal d’appel (accepter / refuser / raccrocher, micro, caméra).
- Pour tester à deux : ouvre **http://localhost:4200** dans une fenêtre privée (ou un autre navigateur), connecte un 2ᵉ compte, et lance un appel depuis le premier.

### 6) Cours

- **http://localhost:4200/courses** (réservé aux utilisateurs connectés).
- Liste des cours (carte cours, etc.).

### 7) Déconnexion

- Navbar → **Logout** → redirection vers **/login**.
- Après reconnexion, retour sur le Chat possible et WebSocket se reconnecte.

---

## 6. Si le backend ou le frontend ne démarre pas

### Backend (Spring Boot)

- **MySQL** : vérifie que la base `smartlingua_messaging` existe et que user/mot de passe dans `application.properties` sont corrects.
- Sinon utilise la config **« SmartLingua - Backend (Dev H2) »** (pas de MySQL).
- Vérifie que le port **8092** n’est pas déjà utilisé.

### Frontend (Angular)

- La config **« SmartLingua - Frontend »** pointe vers  
  `c:\pi\smartLingua\smartLingua\package.json`  
  et lance `npm run start` (équivalent à `ng serve`).
- Si le port **4200** est pris, Angular peut proposer un autre port (ex. 4201) : ouvre l’URL indiquée dans la console.

### Page blanche

- On a retiré Keycloak du démarrage : l’app utilise uniquement la **session locale** (login/register sur le backend 8092).
- Ouvre la console du navigateur (F12) pour voir d’éventuelles erreurs.

---

## 7. Récap des run configurations IntelliJ

| Configuration | Rôle |
|---------------|------|
| **SmartLingua - App (Backend + Frontend)** | Lance backend + frontend en une fois. |
| **SmartLingua - Backend (MySQL)** | Lance uniquement le microservice Messaging (MySQL, port 8092). |
| **SmartLingua - Backend (Dev H2)** | Idem avec base H2 en mémoire (sans MySQL). |
| **SmartLingua - Frontend** | Lance `ng serve` pour l’app Angular. |

En résumé : ouvre **c:\pi\backend\backend\backEnd** dans IntelliJ, lance **« SmartLingua - App (Backend + Frontend) »**, puis va sur **http://localhost:4200** pour voir toutes les fonctionnalités de A à Z.
