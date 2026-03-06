# 📨 Guide du Module Messaging - SmartLingua

## 🎯 Vue d'ensemble

Ce document explique étape par étape ce qui a été implémenté pour le **Module 6 : Messaging Instantané** du projet SmartLingua.

## ✅ Fonctionnalités Implémentées

### 1. **Messaging Privé** ✅
- Envoi de messages entre étudiants et enseignants
- Historique des messages sauvegardé en base de données
- Statut de lecture des messages (lu/non lu)

### 2. **Gestion des Conversations** ✅
- Création automatique de conversations entre utilisateurs
- Récupération de toutes les conversations d'un utilisateur
- Affichage de l'historique complet d'une conversation

### 3. **Invitations** ✅
- Envoi d'invitations aux discussions ou événements
- Acceptation/Rejet des invitations
- Suivi du statut des invitations (PENDING, ACCEPTED, REJECTED)

### 4. **Messaging en Temps Réel** ✅
- WebSocket pour les messages instantanés
- Notifications en temps réel

---

## 📁 Structure du Projet

```
messaging/
├── src/main/java/com/esprit/messaging/
│   ├── entity/              # Entités JPA
│   │   ├── Message.java
│   │   ├── Conversation.java
│   │   └── Invitation.java
│   ├── repository/          # Repositories Spring Data JPA
│   │   ├── MessageRepository.java
│   │   ├── ConversationRepository.java
│   │   └── InvitationRepository.java
│   ├── service/             # Services métier
│   │   ├── MessageService.java
│   │   ├── ConversationService.java
│   │   └── InvitationService.java
│   ├── controller/          # Controllers REST
│   │   ├── MessageController.java
│   │   ├── ConversationController.java
│   │   ├── InvitationController.java
│   │   └── WebSocketController.java
│   ├── dto/                 # Data Transfer Objects
│   │   ├── MessageDTO.java
│   │   ├── ConversationDTO.java
│   │   ├── InvitationDTO.java
│   │   └── SendMessageRequest.java
│   ├── config/              # Configuration
│   │   └── WebSocketConfig.java
│   └── MessagingApplication.java
```

---

## 🗄️ Modèle de Données

### **Message**
- `id` : Identifiant unique
- `senderId` : ID de l'expéditeur
- `receiverId` : ID du destinataire
- `content` : Contenu du message (max 2000 caractères)
- `timestamp` : Date et heure d'envoi
- `isRead` : Statut de lecture (true/false)
- `conversation` : Conversation à laquelle appartient le message

### **Conversation**
- `id` : Identifiant unique
- `participant1Id` : Premier participant
- `participant2Id` : Deuxième participant
- `createdAt` : Date de création
- `updatedAt` : Date de dernière mise à jour
- `messages` : Liste des messages

### **Invitation**
- `id` : Identifiant unique
- `senderId` : ID de l'expéditeur
- `receiverId` : ID du destinataire
- `message` : Message d'invitation
- `invitationType` : Type (DISCUSSION, EVENT)
- `status` : Statut (PENDING, ACCEPTED, REJECTED)
- `createdAt` : Date de création
- `respondedAt` : Date de réponse

---

## 🔌 Endpoints REST API

### **Messages**

#### 1. Envoyer un message
```
POST /messaging/messages/send/{senderId}
Body: {
  "receiverId": 2,
  "content": "Bonjour, j'ai une question..."
}
```

#### 2. Récupérer les messages d'une conversation
```
GET /messaging/messages/conversation/{conversationId}
```

#### 3. Récupérer les messages entre deux utilisateurs
```
GET /messaging/messages/between/{userId1}/{userId2}
```

#### 4. Marquer les messages comme lus
```
PUT /messaging/messages/mark-read/{userId}/{conversationId}
```

#### 5. Compter les messages non lus
```
GET /messaging/messages/unread-count/{userId}
```

#### 6. Récupérer les messages non lus
```
GET /messaging/messages/unread/{userId}
```

### **Conversations**

#### 1. Récupérer toutes les conversations d'un utilisateur
```
GET /messaging/conversations/user/{userId}
```

#### 2. Récupérer une conversation spécifique
```
GET /messaging/conversations/{conversationId}/user/{userId}
```

#### 3. Trouver ou créer une conversation
```
GET /messaging/conversations/between/{userId1}/{userId2}
```

### **Invitations**

#### 1. Créer une invitation
```
POST /messaging/invitations/create
Body: {
  "senderId": 1,
  "receiverId": 2,
  "message": "Voulez-vous rejoindre notre discussion?",
  "invitationType": "DISCUSSION"
}
```

#### 2. Récupérer les invitations reçues
```
GET /messaging/invitations/received/{userId}
```

#### 3. Récupérer les invitations envoyées
```
GET /messaging/invitations/sent/{userId}
```

#### 4. Récupérer les invitations en attente
```
GET /messaging/invitations/pending/{userId}
```

#### 5. Accepter une invitation
```
PUT /messaging/invitations/{invitationId}/accept
```

#### 6. Rejeter une invitation
```
PUT /messaging/invitations/{invitationId}/reject
```

#### 7. Compter les invitations en attente
```
GET /messaging/invitations/pending-count/{userId}
```

---

## 🔄 WebSocket - Messaging en Temps Réel

### Configuration
- **Endpoint WebSocket** : `/ws-messaging`
- **Broker** : `/topic` et `/queue`
- **Préfixe application** : `/app`

### Utilisation

#### 1. Connexion WebSocket
```javascript
const socket = new SockJS('http://localhost:8092/ws-messaging');
const stompClient = Stomp.over(socket);
```

#### 2. Envoyer un message
```javascript
stompClient.send('/app/chat.sendMessage', {}, JSON.stringify({
  senderId: 1,
  receiverId: 2,
  content: "Message en temps réel"
}));
```

#### 3. Écouter les messages reçus
```javascript
stompClient.subscribe('/queue/messages/1', (message) => {
  const messageData = JSON.parse(message.body);
  console.log('Nouveau message:', messageData);
});
```

#### 4. Marquer comme lu
```javascript
stompClient.send('/app/chat.markAsRead', {}, JSON.stringify({
  userId: 1,
  conversationId: 5
}));
```

---

## 🚀 Comment Tester

### 1. Démarrer le microservice
```bash
cd backend/backend/backEnd/microservices/messaging
mvn spring-boot:run
```

Le service démarre sur le port **8092**.

### 2. Accéder à la console H2
```
http://localhost:8092/h2
```
- URL JDBC: `jdbc:h2:mem:testdb`
- Username: `taher`
- Password: (vide)

### 3. Tester avec Postman ou cURL

**Exemple : Envoyer un message**
```bash
curl -X POST http://localhost:8092/messaging/messages/send/1 \
  -H "Content-Type: application/json" \
  -d '{"receiverId": 2, "content": "Bonjour!"}'
```

**Exemple : Récupérer les conversations**
```bash
curl http://localhost:8092/messaging/conversations/user/1
```

---

## 📝 Prochaines Étapes Suggérées

1. **Intégration avec le Frontend Angular**
   - Créer les services Angular pour appeler les APIs
   - Créer les composants pour l'interface de chat
   - Intégrer WebSocket côté frontend

2. **Améliorations Possibles**
   - Ajouter la validation des données
   - Ajouter la pagination pour les messages
   - Ajouter la recherche dans les messages
   - Ajouter les pièces jointes (fichiers, images)
   - Ajouter les notifications push

3. **Sécurité**
   - Ajouter l'authentification JWT
   - Vérifier les permissions (un utilisateur ne peut pas voir les conversations d'un autre)
   - Ajouter la validation des rôles (Student, Teacher, Admin)

---

## 🎓 Explication Étape par Étape

### **Étape 1 : Entités (Entities)**
Les entités représentent les tables de la base de données. Elles utilisent JPA/Hibernate pour mapper les objets Java aux tables SQL.

### **Étape 2 : Repositories**
Les repositories permettent d'accéder aux données. Spring Data JPA génère automatiquement les implémentations des méthodes de base (save, findById, etc.).

### **Étape 3 : DTOs (Data Transfer Objects)**
Les DTOs sont utilisés pour transférer les données entre les couches. Ils évitent d'exposer directement les entités.

### **Étape 4 : Services**
Les services contiennent la logique métier. Ils utilisent les repositories pour accéder aux données et effectuent les traitements nécessaires.

### **Étape 5 : Controllers**
Les controllers exposent les endpoints REST. Ils reçoivent les requêtes HTTP, appellent les services, et retournent les réponses.

### **Étape 6 : WebSocket**
WebSocket permet la communication bidirectionnelle en temps réel entre le client et le serveur, essentiel pour le chat instantané.

---

## ❓ Questions Fréquentes

**Q: Comment créer une nouvelle conversation?**
R: Une conversation est créée automatiquement lors de l'envoi du premier message entre deux utilisateurs.

**Q: Comment savoir si un message a été lu?**
R: Utilisez le champ `isRead` dans le MessageDTO. Il devient `true` après l'appel à l'endpoint `mark-read`.

**Q: Comment tester WebSocket?**
R: Utilisez un client WebSocket comme Postman (version récente) ou créez une page HTML simple avec JavaScript.

---

## 📚 Ressources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring WebSocket](https://docs.spring.io/spring-framework/reference/web/websocket.html)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)

---

**Bon développement! 🚀**
