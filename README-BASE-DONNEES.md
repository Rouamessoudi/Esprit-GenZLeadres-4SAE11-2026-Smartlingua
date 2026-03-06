# SmartLingua – Tout en base (A à Z)

Pour **voir tout enregistré en base** (utilisateurs, messages, conversations, invitations) après le run et l’utilisation de l’application :

---

## 1. Démarrer avec MySQL

1. **Démarrer MySQL** (XAMPP, WAMP ou service Windows).
2. **Créer la base une fois** : aller dans  
   `backend\backend\backEnd\microservices\messaging`  
   et lancer **`create-mysql-database.bat`**.
3. **Lancer l’application** : à la racine (**c:\pi**), double-cliquer sur  
   **`Demarrer-SmartLingua-MySQL.bat`**.  
   → Backend (port 8092) + frontend (port 4200) + ouverture du navigateur.

---

## 2. Utiliser l’application

- **S’inscrire** (2 comptes ou plus, rôle Student/Teacher).
- **Se connecter**, aller au **Chat**, envoyer des **messages**.
- Utiliser les **invitations** si l’interface le propose.

Tout est enregistré dans la base MySQL **smartlingua_messaging**.

---

## 3. Voir les données en base

- **phpMyAdmin** : base **smartlingua_messaging** → onglet **SQL** → coller et exécuter le contenu de  
  **`backend\backend\backEnd\microservices\messaging\VOIR-DONNEES-BASE.sql`**.
- **MySQL en ligne de commande** (depuis le dossier messaging) :
  ```bash
  mysql -u root -p smartlingua_messaging < VOIR-DONNEES-BASE.sql
  ```

Tu verras les 4 tables : **app_user**, **conversations**, **messages**, **invitations**.

---

## Sans MySQL (H2)

Double-cliquer sur **`Demarrer-SmartLingua.bat`** (profil dev, base H2 dans `%USERPROFILE%\.smartlingua_messaging\`).  
Pour consulter les données H2 : console H2 ou outil SQL sur le fichier de base.
