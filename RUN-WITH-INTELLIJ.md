# Lancer SmartLingua depuis IntelliJ (tout depuis l'IDE)

Tu peux tout lancer depuis IntelliJ : **backend** et **frontend** avec les configurations de run déjà prêtes.

---

## 1. Ouvrir le bon projet dans IntelliJ

- **File → Open** → choisis le dossier :  
  **`c:\pi\backend\backEnd`**  
- Clique **OK** et laisse IntelliJ indexer le projet (Maven, modules, etc.).

Tu dois avoir le module **messaging** dans le projet (backend Spring Boot).

---

## 2. Configurations de run disponibles

Une fois le projet ouvert, en haut à droite dans la liste des configurations tu devrais voir :

| Configuration | Rôle |
|---------------|------|
| **SmartLingua - Backend (MySQL)** | Lance le backend sur le port **8092** avec **MySQL** (tout en base). À utiliser si MySQL est démarré et la base `smartlingua_messaging` créée. |
| **SmartLingua - Backend (Dev H2)** | Lance le backend sur le port **8092** avec la base **H2** (fichier, pas besoin de MySQL). |
| **SmartLingua - Frontend** | Lance le frontend Angular sur le port **4200** (`npm start` dans `frontend`). |
| **SmartLingua - App (Backend + Frontend)** | Lance en parallèle le backend MySQL et le frontend (si la config compound est reconnue). |

Si **SmartLingua - Frontend** n'apparaît pas ou ne fonctionne pas (projet ouvert sans module Node/angular), crée-la à la main :
- **Run → Edit Configurations… → + → NPM**
- **package.json** : `c:\pi\frontend\package.json`
- **Scripts** : `start`
- **Name** : `SmartLingua - Frontend` → **OK**

---

## 3. Lancer l'application

### Option A – Tout depuis IntelliJ (recommandé)

1. **MySQL** : démarre MySQL (XAMPP, WAMP ou service) et assure-toi que la base **smartlingua_messaging** existe (une fois : exécuter `create-mysql-database.bat` dans le dossier `messaging`).
2. Dans la liste des configurations, choisis **SmartLingua - Backend (MySQL)** puis clique sur **Run** (flèche verte).
3. Attends le message **Started MessagingApplication** dans la console.
4. Choisis **SmartLingua - Frontend** puis **Run**.
5. Attends le message du type **Application bundle generation complete** et l'URL **http://localhost:4200**.
6. Ouvre **http://localhost:4200** dans ton navigateur (ou utilise **Run → Open Browser** si configuré).

### Option B – Sans MySQL (H2)

1. Choisis **SmartLingua - Backend (Dev H2)** puis **Run**.
2. Puis **SmartLingua - Frontend** puis **Run**.
3. Ouvre **http://localhost:4200**.

### Option C – Une seule config (si disponible)

- Sélectionne **SmartLingua - App (Backend + Frontend)** et lance : backend et frontend démarrent ensemble.

---

## 4. Vérifier que tout fonctionne

- **Backend** : http://localhost:8092/api/auth/health → doit afficher **OK**
- **Frontend** : http://localhost:4200 → page d'accueil SmartLingua, inscription / connexion possibles

---

## 5. Résumé

| Étape | Dans IntelliJ | Résultat |
|-------|----------------|----------|
| 1 | Ouvrir le projet **backEnd** (`c:\pi\backend\backEnd`) | Projet avec module messaging |
| 2 | Lancer **SmartLingua - Backend (MySQL)** ou **(Dev H2)** | Backend sur port 8092 |
| 3 | Lancer **SmartLingua - Frontend** | Frontend sur port 4200 |
| 4 | Ouvrir http://localhost:4200 | Application prête |

Les configurations sont enregistrées dans **`.idea/runConfigurations/`** (fichiers `SmartLingua_*.xml`) pour pouvoir être partagées ou versionnées.
