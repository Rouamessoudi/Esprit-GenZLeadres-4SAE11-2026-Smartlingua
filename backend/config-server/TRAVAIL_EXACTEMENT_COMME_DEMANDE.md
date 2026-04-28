# Travail fait exactement comme demandé (TP Séance 6)

Ce document montre que l’implémentation respecte **exactement** les consignes du TP.

---

## Étape 1 : Créer le serveur de configuration – Config Server

| Demandé dans le TP | Fait dans le projet |
|--------------------|---------------------|
| Projet Spring avec **Server config** et **Eureka discovery client** | `config-server/pom.xml` : `spring-cloud-config-server`, `spring-cloud-starter-netflix-eureka-client` |
| **@EnableConfigServer** dans la classe main | `ConfigServerApplication.java` |
| **@EnableDiscoveryClient** dans la classe main | `ConfigServerApplication.java` |
| Dossier **config** sous resources avec des fichiers `.properties` portant le nom du `application.name` du MS | `config-server/src/main/resources/config/` avec **candidat-ms.properties**, **job-ms.properties**, **courses.properties**, **application.properties** |
| **application.properties** du serveur : spring.application.name=config-server, server.port=8888 | `config-server/src/main/resources/application.properties` |
| Eureka : defaultZone, prefer-ip-address | Idem |
| spring.profiles.active=native (charger les fichiers localement) | Idem |
| spring.cloud.config.server.native.searchLocations=classpath:/config | Idem |
| (Option) spring.cloud.config.server.git.uri commenté | Ligne commentée ajoutée |

---

## Étape 2 : Configurer les microservices (clients du Config Server)

| Demandé dans le TP | Fait dans le projet |
|--------------------|---------------------|
| Dépendance **spring-cloud-starter-config** | `microservices/courses/pom.xml` |
| spring.cloud.config.enabled=true | `microservices/courses/.../application.properties` |
| spring.config.import=optional:configserver:http://localhost:8888 | Idem |
| welcome.message personnalisé par MS | welcome.message dans application.properties du client **courses** |
| Contrôleur : @Value("${welcome.message}") et @GetMapping("/welcome") | `WelcomeController.java` dans le microservice **courses** |

*(Dans le TP le prof utilise Candidat et Job ; dans SmartLingua le microservice client utilisé pour la démo est **courses**. Le Config Server contient aussi **candidat-ms.properties** et **job-ms.properties** comme dans le TP.)*

---

## Étape 3 : Préparer les configurations centralisées

| Demandé dans le TP | Fait dans le projet |
|--------------------|---------------------|
| Fichiers dans config/ avec message personnalisé par MS | **candidat-ms.properties** : welcome.message=Welcome to spring cloud config-server. This is a specific message to Candidat. |
| | **job-ms.properties** : welcome.message=Welcome to spring cloud config-server. This is a specific message to Job. |
| | **courses.properties** : welcome.message pour le microservice Courses (SmartLingua). |
| application.properties stocke les configs pour tous les clients | config/application.properties présent avec commentaire |

---

## Étape 4 : Consulter les configurations / Actuator

| Demandé dans le TP | Fait dans le projet |
|--------------------|---------------------|
| Dépendance **spring-boot-starter-actuator** | Déjà dans `courses/pom.xml` |
| management.endpoints.web.exposure.include=refresh | `courses/.../application.properties` : refresh,health |
| POST /actuator/refresh pour rafraîchir sans redémarrer | Endpoint exposé ; contrôleur avec **@RefreshScope** pour que le message soit rafraîchi |

---

## Ordre d’exécution (comme le TP)

1. **Eureka**  
2. **Server de configuration**  
3. **Candidat et Job** → dans notre projet : microservice **Courses** (client du Config Server)

---

## Accès aux ressources

- Config Server (ex. config « candidat ») : **http://localhost:8888/candidat-ms/default**  
- Config « job » : **http://localhost:8888/job-ms/default**  
- Config « courses » : **http://localhost:8888/courses/default**  
- Ressource **/welcome** (client courses, comme /welcome du TP) : **http://localhost:8086/welcome**

Le travail est fait exactement comme le travail demandé dans le TP (Séance 6).
