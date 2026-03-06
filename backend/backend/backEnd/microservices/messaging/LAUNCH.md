# Démarrer le microservice Messaging

## Erreur "Error creating bean with name 'entityManagerFactory'"

Cette erreur signifie que **Spring n’a pas pu créer la connexion JPA à la base**. En général, **MySQL n’est pas démarré** ou n’est pas joignable. À faire dans l’ordre :

### 1. Démarrer MySQL (XAMPP)

- Ouvre **XAMPP Control Panel**.
- Clique sur **Start** à côté de **MySQL**.
- Attends que le statut devienne vert (MySQL running).

### 2. Mot de passe root

- Si tu as défini un mot de passe pour l’utilisateur **root** dans MySQL, indique-le dans :
  - `src/main/resources/application.properties`
  - ligne : `spring.datasource.password=TON_MOT_DE_PASSE`

### 3. Relancer MessagingApplication

- Dans IntelliJ : **Stop** puis **Run** sur **MessagingApplication**.
- La base `smartlingua_messaging` est créée automatiquement au premier démarrage réussi.

### 4. Si l’erreur persiste

- Dans la console IntelliJ, déroule la stack trace et cherche la ligne **"Caused by:"** (souvent en bas).
- Exemples :
  - `Communications link failure` / `Connection refused` → MySQL pas démarré ou mauvais port (3306).
  - `Access denied for user 'root'` → mot de passe incorrect dans `application.properties`.
  - `Unknown database` → laisser l’app créer la base (option `createDatabaseIfNotExist=true` déjà présente).

### 5. Ensuite : frontend

- Dans un terminal : `cd c:\pi\smartLingua\smartLingua` puis `ng serve`.
- Ouvre http://localhost:4200/

---

**Résumé :** Démarrer **MySQL dans XAMPP** avant de lancer **MessagingApplication**.
