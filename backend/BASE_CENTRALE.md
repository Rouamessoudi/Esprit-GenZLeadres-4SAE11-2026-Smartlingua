# Base centrale SmartLingua – une base pour toute l’équipe

Ce guide explique comment faire en sorte que **toute l’équipe** utilise **une seule base de données** :

- **Inscription (Sign up)** → enregistrée dans **Keycloak** (comptes utilisateurs).
- **Cours, quiz, forum, exams, messaging, privetcours, users** → enregistrés dans **une base PostgreSQL centrale** (`smartlingua_db`), avec un **schéma par microservice**.

---

## 1. Qui enregistre quoi où ?

| Action | Où c’est enregistré |
|--------|---------------------|
| Création de compte (Sign up) | **Keycloak** (base interne Keycloak ou PostgreSQL si tu l’as configuré) |
| Ajout d’un cours | Base centrale → schéma **courses** |
| Ajout d’un quiz | Base centrale → schéma **quiz** |
| Forum, exams, messaging, privetcours, users | Base centrale → schéma du même nom |

Tout le monde pointe vers la **même base** `smartlingua_db` sur le **même serveur PostgreSQL** (ou la même machine).

---

## 2. Installer et démarrer PostgreSQL

### Option A – Docker (recommandé)

```powershell
docker run -d --name postgres-smartlingua -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

### Option B – Installation Windows

1. Télécharge PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installe (garder le port 5432 et note le mot de passe de l’utilisateur `postgres`).
3. Démarre le service PostgreSQL.

---

## 3. Créer la base et les schémas (une seule fois)

1. Ouvre un client PostgreSQL (pgAdmin, DBeaver, ou ligne de commande `psql`).
2. Connecte-toi en tant que `postgres` (ou admin).
3. Exécute le script :  
   `backend/backend/backEnd/scripts/init-central-db.sql`

   - **Étape 1** : connecté à la base `postgres`, exécute :
     ```sql
     CREATE DATABASE smartlingua_db WITH ENCODING = 'UTF8';
     ```
   - **Étape 2** : connecte-toi à la base **smartlingua_db**, puis exécute la partie du script qui crée les schémas (`CREATE SCHEMA ...`).

Tu obtiens une base `smartlingua_db` avec les schémas :  
`courses`, `users`, `quiz`, `forum`, `exams`, `messaging`, `privetcours`.

---

## 4. Lancer les microservices avec la base centrale

Chaque microservice a un fichier **application-central.properties** qui pointe vers cette base avec **son schéma**.

Pour utiliser la base centrale, lance chaque microservice avec le **profil Spring `central`** :

- **Ligne de commande** :
  ```bash
  cd backend/backend/backEnd/microservices/courses
  mvn spring-boot:run -Dspring-boot.run.profiles=central
  ```
  Idem pour `users`, `quiz`, `forum`, `exams`, `messaging`, `privetcours` en remplaçant le dossier.

- **Dans ton IDE** : ajoute dans la config de run :  
  **Active profiles** : `central`

- **Variable d’environnement** :
  ```bash
  set SPRING_PROFILES_ACTIVE=central
  mvn spring-boot:run
  ```

Si tu ne mets **pas** le profil `central`, le microservice utilisera la config par défaut (souvent H2 en mémoire, chacun sa propre base).

---

## 5. Mot de passe PostgreSQL

Par défaut, les fichiers `application-central.properties` utilisent :

- **Username** : `postgres`
- **Password** : `postgres`

Si ton PostgreSQL a un autre mot de passe, modifie dans chaque fichier `application-central.properties` :

```properties
spring.datasource.username=postgres
spring.datasource.password=TON_MOT_DE_PASSE
```

Ou définis des variables d’environnement et utilise dans les properties :

```properties
spring.datasource.password=${DB_PASSWORD:postgres}
```

---

## 6. Résumé pour l’équipe

- **Une machine (ou serveur)** avec PostgreSQL qui tourne.
- **Une base** : `smartlingua_db`, avec les schémas créés une fois (script `init-central-db.sql`).
- **Keycloak** : un seul Keycloak pour toute l’équipe (inscriptions / connexions).
- **Chaque dev** : lance ses microservices avec le profil **central** pour que cours, quiz, forum, etc. s’enregistrent dans cette base centrale.

Comme ça, quand toi tu ajoutes un cours, ton camarade ajoute un quiz, un autre le forum, tout est bien enregistré dans la **même base** `smartlingua_db`, chacun dans son schéma.
