# Checklist de vérification – Envoi d’invitation (Ajouter ami)

## Cause racine identifiée

- **Erreur backend** : `Field 'invitationType' doesn't have a default value` sur la table `invitations`.
- La table contenait une colonne `invitationType` (camelCase) sans valeur par défaut, alors qu’Hibernate n’insère que dans `invitation_type`. L’INSERT échouait → 400 → le frontend affichait « Invitation non envoyée. » (message par défaut car le vrai message contenait "constraint" et était masqué).

## Commandes pour lancer

```bash
# 1) MySQL (XAMPP) : démarrer MySQL.

# 2) Backend (depuis la racine du microservice messaging)
cd c:\pi\backend\backend\backEnd\microservices\messaging
mvn spring-boot:run

# 3) Frontend
cd c:\pi\smartLingua\smartLingua
npm start
# Puis ouvrir http://localhost:4200
```

## Postman – POST création d’invitation

- **Méthode** : `POST`
- **URL** : `http://localhost:8092/messaging/invitations/create`
- **Headers** : `Content-Type: application/json`
- **Body (raw JSON)** :
```json
{
  "senderId": 1,
  "receiverId": 2,
  "message": "Souhaite discuter avec toi.",
  "invitationType": "DISCUSSION"
}
```

**Réponse attendue** : `201 Created` avec body JSON contenant `id`, `senderId`, `receiverId`, `status: "PENDING"`, `message`, `invitationType`, `createdAt`.

**Cas d’erreur** :
- `400` + `{"message": "senderId et receiverId requis."}` si champ manquant.
- `400` + `{"message": "Vous ne pouvez pas vous envoyer une invitation à vous-même."}` si senderId = receiverId.
- `404` + `{"message": "Utilisateur destinataire introuvable."}` si `receiverId` n’existe pas en base.

## Vérification UI (checklist manuelle)

1. **Login A** : se connecter avec un utilisateur (ex. majd).
2. **Recherche B** : aller dans Chat → rechercher un autre utilisateur (ex. gayth).
3. **Clic « Ajouter ami »** (icône person_add) à côté de B.
4. **Résultat attendu** : message de succès (ex. « Demande d’invitation envoyée… »), pas « Invitation non envoyée. ».
5. **Côté B** : se connecter avec B (autre navigateur ou session privée), aller dans Chat → onglet **Invitations**.
6. **Résultat attendu** : l’invitation de A apparaît (Accepter / Refuser). Si B est déjà connecté au chat, il peut recevoir la notif en temps réel (« Vous avez reçu une nouvelle invitation… »).
7. **WebSocket** : avec les DevTools (Network → WS), vérifier que le receveur est bien abonné à une destination du type `/queue/invitations/{receiverId}` et reçoit un message à la création.

## Tests automatisés

```bash
cd c:\pi\backend\backend\backEnd\microservices\messaging
mvn test
```

- **InvitationServiceTest** : création d’invitation avec `status` PENDING et `senderId`/`receiverId` corrects.
- **InvitationControllerTest** : MockMvc POST `/messaging/invitations/create` → 201 + JSON (id, status PENDING, senderId, receiverId) et envoi WS vers `/queue/invitations/{receiverId}`.

## Fichiers modifiés / ajoutés

| Fichier | Modification |
|--------|---------------|
| `InvitationTableFixRunner.java` | Ordre des correctifs : traiter d’abord la colonne `invitationType` (DEFAULT ou DROP) pour éviter l’erreur SQL à l’INSERT. |
| `InvitationController.java` | Logs, validation (pas de self-invite, `receiverId` existe), messages d’erreur explicites. |
| `InvitationServiceTest.java` | Test `createInvitation_returnsPendingWithCorrectSenderAndReceiver`. |
| `InvitationControllerTest.java` | **Nouveau** : tests MockMvc POST 201, 400 (champ manquant, self-invite). |

## Si le bug réapparaît

1. Redémarrer le backend une fois (pour que `InvitationTableFixRunner` s’exécute).
2. Vérifier en base que la table `invitations` n’a qu’une seule colonne de type (ex. `invitation_type`) avec `DEFAULT 'DISCUSSION'`, ou que `invitationType` a bien un défaut.
3. En cas d’erreur, regarder les logs backend `[invitation] create:` et la réponse HTTP (status + body) dans l’onglet Network du navigateur.
