# Documentation des API – Module Forum (Communication, Announcements, and Forum)

## Explication des termes

### Qu'est-ce qu'une API ?
Une **API** (Application Programming Interface) est une interface qui permet à des applications (frontend, mobile, autre microservice) de communiquer avec le backend. Dans notre cas, ce sont des **endpoints REST** accessibles via HTTP (GET, POST, PUT, PATCH, DELETE).

### Qu'est-ce qu'une signature d'API ?
La **signature** d'une API décrit précisément :
- **Méthode HTTP** : GET, POST, PUT, PATCH, DELETE
- **URL / chemin** : l'adresse de l'endpoint
- **Paramètres** : path variables (`{id}`), query params (`?category=...`)
- **Corps de la requête (Body)** : structure JSON pour POST/PUT
- **Réponse** : structure JSON retournée et code HTTP

---

## Base URL
```
http://localhost:8090/forum
```
*(ou via API Gateway : http://localhost:8093/forum)*

---

## 1. Forum – Posts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/forum/posts` | Liste tous les posts |
| GET | `/forum/posts?category={cat}` | Liste les posts filtrés par catégorie |
| GET | `/forum/posts/{id}` | Détail d'un post |
| POST | `/forum/posts` | Créer un post |
| PUT | `/forum/posts/{id}` | Modifier un post |
| PATCH | `/forum/posts/{id}/moderate?moderated={bool}` | Modérer un post |
| DELETE | `/forum/posts/{id}` | Supprimer un post |

### Signatures détaillées

#### GET `/forum/posts`
- **Paramètres query** : `category` (optionnel, string)
- **Réponse** : `200 OK` → `List<ForumPost>`
- **Exemple** : `GET /forum/posts?category=Grammar`

#### GET `/forum/posts/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `200 OK` → `ForumPost` ou `404 Not Found`

#### POST `/forum/posts`
- **Body** : `ForumPostRequest` (JSON)
```json
{
  "title": "string (obligatoire, max 200)",
  "content": "string (obligatoire)",
  "authorId": "number (obligatoire)",
  "category": "string (optionnel, max 100)"
}
```
- **Réponse** : `201 Created` → `ForumPost`

#### PUT `/forum/posts/{id}`
- **Paramètres path** : `id` (Long)
- **Body** : même structure que `ForumPostRequest`
- **Réponse** : `200 OK` → `ForumPost` ou `404 Not Found`

#### PATCH `/forum/posts/{id}/moderate`
- **Paramètres path** : `id` (Long)
- **Paramètres query** : `moderated` (boolean, obligatoire)
- **Réponse** : `200 OK` → `ForumPost` ou `404 Not Found`

#### DELETE `/forum/posts/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `204 No Content` ou `404 Not Found`

---

## 2. Forum – Commentaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/forum/comments/post/{postId}` | Liste les commentaires d'un post |
| GET | `/forum/comments/{id}` | Détail d'un commentaire |
| POST | `/forum/comments` | Créer un commentaire |
| PUT | `/forum/comments/{id}` | Modifier un commentaire |
| PATCH | `/forum/comments/{id}/moderate?moderated={bool}` | Modérer un commentaire |
| DELETE | `/forum/comments/{id}` | Supprimer un commentaire |

### Signatures détaillées

#### GET `/forum/comments/post/{postId}`
- **Paramètres path** : `postId` (Long)
- **Réponse** : `200 OK` → `List<Comment>`

#### GET `/forum/comments/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `200 OK` → `Comment` ou `404 Not Found`

#### POST `/forum/comments`
- **Body** : `CommentRequest` (JSON)
```json
{
  "content": "string (obligatoire, max 2000)",
  "postId": "number (obligatoire)",
  "authorId": "number (obligatoire)",
  "parentCommentId": "number (optionnel, pour réponse)"
}
```
- **Réponse** : `201 Created` → `Comment`

#### PUT `/forum/comments/{id}`
- **Paramètres path** : `id` (Long)
- **Body** : `CommentUpdateRequest` (JSON)
```json
{
  "content": "string (obligatoire, max 2000)"
}
```
- **Réponse** : `200 OK` → `Comment` ou `404 Not Found`

#### PATCH `/forum/comments/{id}/moderate`
- **Paramètres path** : `id` (Long)
- **Paramètres query** : `moderated` (boolean, obligatoire)
- **Réponse** : `200 OK` → `Comment` ou `404 Not Found`

#### DELETE `/forum/comments/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `204 No Content` ou `404 Not Found`

---

## 3. Annonces (Announcements)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/forum/announcements` | Liste toutes les annonces |
| GET | `/forum/announcements/active` | Liste les annonces actives |
| GET | `/forum/announcements/{id}` | Détail d'une annonce |
| POST | `/forum/announcements` | Créer une annonce |
| PUT | `/forum/announcements/{id}` | Modifier une annonce |
| DELETE | `/forum/announcements/{id}` | Supprimer une annonce |

### Signatures détaillées

#### GET `/forum/announcements`
- **Réponse** : `200 OK` → `List<Announcement>`

#### GET `/forum/announcements/active`
- **Réponse** : `200 OK` → `List<Announcement>` (annonces actives triées par date)

#### GET `/forum/announcements/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `200 OK` → `Announcement` ou `404 Not Found`

#### POST `/forum/announcements`
- **Body** : `AnnouncementRequest` (JSON)
```json
{
  "title": "string (obligatoire, max 200)",
  "content": "string (obligatoire)",
  "authorId": "number (obligatoire)",
  "isActive": "boolean (optionnel, défaut true)"
}
```
- **Réponse** : `201 Created` → `Announcement`

#### PUT `/forum/announcements/{id}`
- **Paramètres path** : `id` (Long)
- **Body** : même structure que `AnnouncementRequest`
- **Réponse** : `200 OK` → `Announcement` ou `404 Not Found`

#### DELETE `/forum/announcements/{id}`
- **Paramètres path** : `id` (Long)
- **Réponse** : `204 No Content` ou `404 Not Found`

---

## 4. Structures des réponses (JSON)

### ForumPost
```json
{
  "id": 1,
  "title": "string",
  "content": "string",
  "authorId": 1,
  "category": "string",
  "isModerated": false,
  "createdAt": "2025-02-18T10:00:00",
  "updatedAt": "2025-02-18T10:00:00"
}
```

### Comment
```json
{
  "id": 1,
  "content": "string",
  "postId": 1,
  "authorId": 1,
  "isModerated": false,
  "createdAt": "2025-02-18T10:00:00",
  "updatedAt": "2025-02-18T10:00:00"
}
```

### Announcement
```json
{
  "id": 1,
  "title": "string",
  "content": "string",
  "authorId": 1,
  "publishedAt": "2025-02-18T10:00:00",
  "isActive": true,
  "createdAt": "2025-02-18T10:00:00",
  "updatedAt": "2025-02-18T10:00:00"
}
```

---

## Récapitulatif – Tableau des API utilisées

| # | Méthode | Endpoint | Usage |
|---|---------|----------|-------|
| 1 | GET | `/forum/posts` | Liste des posts |
| 2 | GET | `/forum/posts?category=...` | Filtre par catégorie |
| 3 | GET | `/forum/posts/{id}` | Détail post |
| 4 | POST | `/forum/posts` | Créer post |
| 5 | PUT | `/forum/posts/{id}` | Modifier post |
| 6 | PATCH | `/forum/posts/{id}/moderate` | Modérer post |
| 7 | DELETE | `/forum/posts/{id}` | Supprimer post |
| 8 | GET | `/forum/comments/post/{postId}` | Commentaires d'un post |
| 9 | GET | `/forum/comments/{id}` | Détail commentaire |
| 10 | POST | `/forum/comments` | Créer commentaire |
| 11 | PUT | `/forum/comments/{id}` | Modifier commentaire |
| 12 | PATCH | `/forum/comments/{id}/moderate` | Modérer commentaire |
| 13 | DELETE | `/forum/comments/{id}` | Supprimer commentaire |
| 14 | GET | `/forum/announcements` | Liste annonces |
| 15 | GET | `/forum/announcements/active` | Annonces actives |
| 16 | GET | `/forum/announcements/{id}` | Détail annonce |
| 17 | POST | `/forum/announcements` | Créer annonce |
| 18 | PUT | `/forum/announcements/{id}` | Modifier annonce |
| 19 | DELETE | `/forum/announcements/{id}` | Supprimer annonce |
