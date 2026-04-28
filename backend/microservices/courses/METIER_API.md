# APIs métier avancées – SmartLingua (module Cours)

Ce document décrit **où se trouve le métier avancé** et **toutes les APIs métier** du microservice **courses**, pour une démo professionnelle et une validation Sprint cohérente.

---

## 1. Où est le métier avancé ?

| Élément | Emplacement |
|--------|-------------|
| **Contrôleur REST** | `backend/backend/backEnd/microservices/courses/.../controllers/MetierController.java` |
| **Service métier** | `.../services/IStatisticsService.java` + `StatisticsServiceImpl.java` |
| **DTOs métier** | `.../DTO/` : `StatisticsDto`, `CourseSummaryDto`, `ResourcesSummaryDto`, `SeancesSummaryDto`, `SeanceWithCourseDto`, `CourseCompletionDto` |
| **Repositories** (requêtes métier) | `.../Repositories/CourseRepository.java`, `ResourceRepository.java`, `SeanceRepository.java` |
| **Frontend – appels API** | `smartLingua/smartLingua/src/app/core/services/course-api.service.ts` (constante `METIER_API`, méthodes `getStatistics()`, `getCourseSummary()`, etc.) |
| **Frontend – affichage** | `.../back-office/courses/course-list-admin.component.ts` (stats, cours à compléter, prochaines séances) et `course-detail.component.ts` (résumés, statut de complétion, prochaine séance) |

Base URL des APIs métier (backend courses) : **`http://localhost:8086/api/metier`**.

---

## 2. Liste des APIs métier (GET)

Toutes les réponses sont en JSON. Les APIs sont **dédiées au métier** (statistiques, résumés, règles de complétion), pas au simple CRUD.

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/metier/statistics` | Statistiques globales : nombre total de cours, ressources, séances ; répartition par niveau (A1–C2) ; répartition ressources par type (PDF, VIDEO, AUDIO) ; durée totale (minutes) des séances à venir. Toujours 200, champs à 0 si vide. |
| GET | `/api/metier/courses/{id}/summary` | Résumé d’un cours : infos cours + `resourceCount`, `seanceCount`. |
| GET | `/api/metier/courses/{id}/resources/summary` | Résumé métier des ressources du cours : `total` + `byType` (PDF, VIDEO, AUDIO). |
| GET | `/api/metier/courses/{id}/seances/summary` | Résumé métier des séances : `totalSeances`, `upcomingCount`, `totalDurationMinutes`. |
| GET | `/api/metier/courses/{id}/next-seance` | **Métier avancé.** Prochaine séance à venir pour ce cours. 200 + DTO si une existe, 404 sinon. |
| GET | `/api/metier/courses/{id}/completion-status` | **Métier avancé.** Statut de complétion : `complete` = au moins 1 ressource et 1 séance ; `hasResources`, `hasSeances`, `message`. |
| GET | `/api/metier/seances/upcoming?limit=10` | Prochaines séances à venir (tous cours), ordre chronologique. Paramètre optionnel `limit`. |
| GET | `/api/metier/courses/incomplete` | Liste des cours « à compléter » : sans ressources ou sans séances (alertes métier). |

---

## 3. Fonctionnalités métier avancées (côté backend)

- **Statistiques agrégées** : totaux et répartitions (niveaux, types de ressources, durée des séances à venir).
- **Résumés par cours** : comptages ressources/séances, résumés par type et par statut (à venir, durée).
- **Règles métier** :  
  - cours « incomplet » = 0 ressource ou 0 séance ;  
  - cours « complet » = au moins 1 ressource et 1 séance ;  
  - prochaine séance = première séance du cours dont la date/heure est après maintenant.
- **APIs dédiées** : pas de mélange avec le CRUD ; URLs explicites sous `/api/metier`.

---

## 4. Où tester dans l’interface

- **Page Liste des cours** (`/admin/courses`) : blocs Statistiques, Cours à compléter, Prochaines séances (appels à `getStatistics()`, `getIncompleteCourses()`, `getUpcomingSeances()`).
- **Page Détail d’un cours** (`/admin/courses/:id/detail`) :  
  - ligne « Ressources / Séances » et résumés (summary, resourcesSummary, seancesSummary) ;  
  - badge **Cours complet** / **À compléter** (`getCourseCompletionStatus`) ;  
  - **Prochaine séance : date – titre (X min)** (`getNextSeanceForCourse`) ;  
  - bouton « Rafraîchir » qui recharge tous ces appels métier.

---

## 5. Commandes utiles

- Démarrer le microservice courses (profil central) :  
  `cd backend/backend/backEnd/microservices/courses`  
  `.\mvnw.cmd clean spring-boot:run "-Dspring-boot.run.profiles=central"`
- Tester une API :  
  `GET http://localhost:8086/api/metier/statistics`  
  `GET http://localhost:8086/api/metier/courses/1/completion-status`  
  `GET http://localhost:8086/api/metier/courses/1/next-seance`

---

*Document à jour avec les APIs métier avancées (next-seance, completion-status) et leur usage dans l’admin.*
