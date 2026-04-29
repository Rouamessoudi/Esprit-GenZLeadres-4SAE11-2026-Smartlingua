# SmartLingua DevOps Sprint 3

## 1) CI Backend (Jenkins)

File: `Jenkinsfile-backend`

- Checks out the repository.
- Runs CI on all Spring Boot services:
  - `backend/apiGateway`
  - `backend/config-server`
  - `backend/eureka`
  - `backend/microservices/users`
  - `backend/microservices/forum`
  - `backend/microservices/messaging`
  - `backend/microservices/courses`
  - `backend/microservices/quiz`
  - `backend/microservices/exams`
  - `backend/microservices/adaptive-learning`
  - `backend/microservices/ai-assistant-service`
  - `backend/microservices/privetcours`
- For each service:
  - Uses `./mvnw` if present.
  - Falls back to `mvn` if wrapper is missing.
  - Executes `test` then `clean package`.
- Publishes Surefire reports and archives JAR/JaCoCo artifacts.

## 2) CI Frontend (Jenkins)

File: `Jenkinsfile-frontend`

- Checks out the repository.
- Runs:
  - `npm install`
  - `npm run build`
  - `npm test -- --watch=false --browsers=ChromeHeadless --code-coverage`
- Designed for headless execution on Jenkins agents.
- Archives frontend coverage artifacts for traceability.

## 3) SonarQube Integration

- Backend SonarQube stage is included in `Jenkinsfile-backend`.
- Frontend SonarQube stage is included in `Jenkinsfile-frontend`.
- Repository-level settings are in `sonar-project.properties`.

Updated sonar settings:
- JaCoCo XML path: `backend/**/target/site/jacoco/jacoco.xml`
- Frontend coverage (LCOV): `frontend/coverage/**/lcov.info`
- Test inclusion patterns for Java/TypeScript test files.

## 4) Coverage

- JaCoCo plugin is already present in backend service `pom.xml` files.
- CI now collects coverage artifacts and keeps paths compatible with SonarQube.

## 5) Monitoring (Prometheus + Grafana)

Files:
- `docker-compose-monitoring.yml`
- `monitoring/prometheus.yml`

What is provided:
- Prometheus on `http://localhost:9090`
- Grafana on `http://localhost:3000` (admin/admin)
- Scrape targets configured for service `/actuator/prometheus` endpoints.

Start monitoring stack:

```bash
docker compose -f docker-compose-monitoring.yml up -d
```

## 6) CD Preparation

Current Jenkins pipelines are CI-first (build + test + quality).
They are ready to be extended with deployment stages (Docker image build/push, environment deployment) once deployment targets are finalized.

## 7) Before / After (Sonar + Quality)

- Before: CI relied mainly on GitHub Actions with fragmented visibility in Jenkins.
- After: Jenkins pipelines are defined for backend and frontend with:
  - Automated test execution
  - Build packaging
  - SonarQube quality analysis
  - Coverage report integration
  - Monitoring stack bootstrap
