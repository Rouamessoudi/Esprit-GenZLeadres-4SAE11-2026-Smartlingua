# Démarrer le microservice Messaging (login, chat, port 8092)

Tout est enregistré en base : **comptes, conversations, messages, invitations, statut lu**.

---

## Tout depuis la racine (A à Z – MySQL)

Pour lancer **backend + frontend** et tout enregistrer en **MySQL** :

1. Démarrer **MySQL** (XAMPP, WAMP ou service).
2. Une seule fois : dans le dossier **`backend\backend\backEnd\microservices\messaging`**, exécuter **`create-mysql-database.bat`** pour créer la base `smartlingua_messaging`.
3. À la racine du projet (**c:\pi**), double-cliquer sur **`Demarrer-SmartLingua-MySQL.bat`** :  
   démarrage du backend (MySQL), puis du frontend, puis ouverture du navigateur.

Après utilisation de l’app (inscription, login, chat, invitations), **tout** est en base. Pour consulter les données : voir la section *Voir les données en base* ci-dessous.

---

## Option 1 : Avec MySQL (recommandé – tout en base)

1. **Démarrer MySQL** (XAMPP, WAMP, ou service Windows).

2. **Créer la base** (une seule fois) :
   - Double-clique sur **`create-mysql-database.bat`** dans ce dossier,  
   - ou dans phpMyAdmin / MySQL exécute :
   ```sql
   CREATE DATABASE IF NOT EXISTS smartlingua_messaging
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Lancer le microservice** : double-clique sur **`start-messaging-mysql.bat`**  
   ou en ligne de commande :
   ```bash
   mvnw.cmd spring-boot:run
   ```
   (sans profil `dev` → utilisation de MySQL.)

Vérifier dans `application.properties` : `spring.datasource.username=root` et `spring.datasource.password=` (vide si pas de mot de passe).

---

## Option 2 : Sans MySQL (profil dev – H2 en fichier)

**Aucune installation MySQL** : tout est enregistré dans un fichier sur ton disque.

- Double-clique sur **`start-messaging-dev.bat`**  
  ou : `mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"`
- Base **H2** dans **`%USERPROFILE%\.smartlingua_messaging\`** (Windows) ou **`~/.smartlingua_messaging/`** (Linux/Mac).
- Comptes, messages et statut « lu » sont conservés entre les redémarrages.

---

## Vérifier que le backend répond

- Dans le navigateur : **http://localhost:8092/api/auth/health**  
  Tu dois voir : `OK`

Ensuite, le formulaire de connexion du front (port 4200) pourra appeler le login sur le port 8092.

---

## Dépannage

### Erreur au démarrage (LoggingFailureAnalysisReporter / APPLICATION FAILED TO START)
Souvent **MySQL n’est pas démarré** ou la base n’existe pas. Deux options :
- **Option A** : Démarrer **MySQL** (XAMPP, WAMP), créer la base avec **`create-mysql-database.bat`**, puis relancer le backend (config **SmartLingua - Backend (MySQL)** dans IntelliJ).
- **Option B** : Lancer **sans MySQL** avec le profil **dev** (H2) : dans IntelliJ choisis **SmartLingua - Backend (Dev H2)** au lieu de (MySQL). Aucune installation MySQL nécessaire.

### « Le serveur (port 8092) ne répond pas »
Démarre le microservice avec le **profil dev** (H2) ou avec **MySQL** (voir ci-dessus), puis rafraîchis la page de login.

### « Port 8092 was already in use »
Un autre programme utilise déjà le port 8092. Ferme l’autre instance du microservice (fenêtre Maven/terminal) ou arrête le processus qui utilise le port. Sous PowerShell : `Get-NetTCPConnection -LocalPort 8092` pour voir le PID, puis `Stop-Process -Id <PID> -Force`.

---

## Voir les données en base (utilisateurs, messages, conversations, invitations)

Après avoir utilisé l’application (inscription, connexion, envoi de messages, invitations), tu peux consulter tout le contenu en base :

- **phpMyAdmin** : sélectionne la base **`smartlingua_messaging`**, onglet **SQL**, puis copie-colle le contenu du fichier **`VOIR-DONNEES-BASE.sql`** (dans ce dossier messaging) et exécute.
- **Ligne de commande MySQL** :
  ```bash
  mysql -u root -p smartlingua_messaging < VOIR-DONNEES-BASE.sql
  ```

Le script affiche les 4 tables : **app_user**, **conversations**, **messages**, **invitations**.
