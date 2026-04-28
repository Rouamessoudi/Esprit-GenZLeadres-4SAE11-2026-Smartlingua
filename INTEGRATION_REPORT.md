# SmartLingua - Rapport d'integration

## Base retenue

- Frontend de base: `SmartLinguaa/smartLingua/smartLingua`
- Backend/infrastructure de base: `SmartLinguaa/backend/backend/backEnd`

Justification:
- frontend deja integre avec Keycloak (`http://localhost:8081`) et modules adaptive;
- backend deja coherent avec une stack unique (`eureka`, `config-server`, `apiGateway`) et le microservice `adaptive-learning`.

## Microservices integres et provenance

- `users` -> base `SmartLinguaa`
- `courses` -> base `SmartLinguaa`
- `quiz` -> base `SmartLinguaa`
- `exams` -> base `SmartLinguaa`
- `forum` -> base `SmartLinguaa`
- `privetcours` -> base `SmartLinguaa`
- `messaging` -> base `SmartLinguaa`
- `adaptive-learning` -> base `SmartLinguaa`
- `ai-assistant-service` -> ajoute depuis `pi/backend/backend/backEnd/microservices/ai-assistant-service`

## Conflits detectes et resolus

1. Conflit d'infrastructure multi-dossiers (Eureka/Config/Gateway dupliques)
   - Resolution: creation d'une seule base finale `SmartLingua-final` basee sur `SmartLinguaa`.

2. Conflit Config Server (`8888` vs `8890`)
   - Resolution: standard final conserve `8890`.
   - Action: `ai-assistant-service` aligne sur `http://localhost:8890`.

3. Service AI non enregistre dans Eureka dans sa version source
   - Resolution: activation Eureka dans `ai-assistant-service` + `defaultZone`.

4. Route Gateway manquante pour AI
   - Resolution: ajout de `/ai-assistant-service/**` vers `lb://ai-assistant-service`.

## Fichiers modifies

- `SmartLingua-final/backend/apiGateway/src/main/resources/application.properties`
- `SmartLingua-final/backend/microservices/ai-assistant-service/src/main/resources/application.properties`

## Fichiers crees

- `SmartLingua-final/INTEGRATION_REPORT.md`
- (dossier final) `SmartLingua-final/` + copie du backend/frontend integres

## Fichiers supprimes

- `SmartLingua-final/backend/.idea` (dossier IDE)
- `SmartLingua-final/backend/microservices/.idea` (dossier IDE)
- `SmartLingua-final/backend/microservices/W01-dev MS.pdf` (document non runtime)

## Structure finale cible

- `SmartLingua-final/frontend` (frontend unique)
- `SmartLingua-final/backend/eureka`
- `SmartLingua-final/backend/config-server`
- `SmartLingua-final/backend/apiGateway`
- `SmartLingua-final/backend/microservices/*` (services metier unifies)

## Ports standards utilises

- Eureka: `8761`
- Config Server: `8890`
- API Gateway: `8093`
- users: `8087`
- courses: `8086`
- quiz: `8088`
- exams: `8089`
- forum: `8090`
- privetcours: `8091`
- messaging: `8092`
- adaptive-learning: `8094`
- ai-assistant-service: `8095`
- frontend Angular: `4200`
- Keycloak: `8081`

## Ordre de demarrage recommande

1. Keycloak (si securite activee)
2. MySQL
3. Eureka
4. Config Server
5. Microservices backend
6. API Gateway
7. Frontend

## Commandes de lancement (exemple local)

Backend (chaque module Spring Boot):
- `cd SmartLingua-final/backend/eureka && mvn spring-boot:run`
- `cd SmartLingua-final/backend/config-server && mvn spring-boot:run`
- `cd SmartLingua-final/backend/microservices/<service> && mvn spring-boot:run`
- `cd SmartLingua-final/backend/apiGateway && mvn spring-boot:run`

Frontend:
- `cd SmartLingua-final/frontend`
- `npm install`
- `npm start` (ou `ng serve`)

## Tests manuels restants

- verifier login/logout Keycloak sur le frontend;
- verifier appels frontend via Gateway (`/users`, `/courses`, `/quiz`, `/adaptive-learning`, `/ai-assistant-service`);
- verifier inscription de tous les services dans Eureka;
- verifier acces DB MySQL pour `users`, `messaging`, `adaptive-learning`, `ai-assistant-service`;
- verifier que les routes Gateway ne retournent pas de 404/503;
- valider parcours adaptive + AI coach de bout en bout.
