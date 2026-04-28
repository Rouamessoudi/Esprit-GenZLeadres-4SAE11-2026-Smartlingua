# DevOps Sprint 3 Validation - SmartLingua

## 1. Run the pipeline

The workflow file is:

- `.github/workflows/ci-cd.yml`

Pipeline triggers:

- `push`
- `pull_request`

To trigger manually, push your branch:

```bash
git push -u origin feature/devops-ci
```

## 2. Where to view GitHub Actions

1. Open the SmartLingua GitHub repository.
2. Go to the `Actions` tab.
3. Open workflow run: `SmartLingua CI/CD Sprint 3`.
4. Verify all jobs:
   - `backend-ci`
   - `frontend-ci`
   - `sonar-backend`
   - `cd-simulated` (on `main` branch only)

## 3. Captures to show to the professor

- Workflow run summary (all jobs green)
- Backend matrix jobs execution
- Frontend CI job logs
- SonarQube job logs showing analysis started/sent
- CD simulated job logs
- Actuator endpoint response in terminal or browser

## 4. SonarQube validation

Required GitHub Secrets:

- `SONAR_HOST_URL`
- `SONAR_TOKEN`

Backend analysis command used in CI:

```bash
mvn clean verify sonar:sonar \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
```

Coverage source:

- JaCoCo XML report: `target/site/jacoco/jacoco.xml`

## 5. Monitoring validation

Backend endpoints:

- `/actuator/health`
- `/actuator/metrics`
- `/actuator/prometheus`

Example:

```bash
curl http://localhost:8087/actuator/health
curl http://localhost:8087/actuator/metrics
curl http://localhost:8087/actuator/prometheus
```

Frontend monitoring validation:

- Build success (`npm run build`)
- Unit tests (`npm test --if-present`)
- Browser performance traces in Chrome DevTools
