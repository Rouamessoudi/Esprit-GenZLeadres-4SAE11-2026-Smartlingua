/**
 * Point d’entrée Keycloak pour le front.
 *
 * Si « Sign in » ouvre une page « localhost a refusé de se connecter » (ERR_CONNECTION_REFUSED),
 * Keycloak n’écoute pas à cette URL : démarrez-le (ex. Docker ci-dessous) ou adaptez `url` / le port.
 *
 * Exemple Docker (realm + client à créer dans l’admin Keycloak : realm `smartlingua`, client `angular`, public, redirect http://localhost:4200/*) :
 *   docker run -p 8081:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
 */
export const keycloakConnectConfig = {
  url: 'http://localhost:8081',
  realm: 'smartlingua',
  clientId: 'angular',
} as const;
