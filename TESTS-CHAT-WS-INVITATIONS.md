# Tests manuels — Chat + WebSocket + Invitations

## Commandes pour démarrer

### Backend (microservice Messaging)
- **Dossier** : `c:\pi\backend\backend\backEnd\microservices\messaging`
- **Commande** : `mvn spring-boot:run`
- **Résultat attendu** : démarrage sans erreur, log du type "Started MessagingApplication", port 8092 (ou celui défini dans `application.properties`).
- Prérequis : MySQL démarré (XAMPP ou autre), base créée selon `create-database.sql` / `README-BASE-DONNEES.md`.

### Frontend (Angular)
- **Dossier** : `c:\pi\smartLingua\smartLingua`
- **Commande** : `npm start` (ou `ng serve`)
- **Résultat attendu** : "Application bundle generation complete", accès à `http://localhost:4200`.

---

## Script de test manuel (2 navigateurs A et B)

1. **Connexion**
   - Navigateur A : aller sur `http://localhost:4200`, se connecter avec un compte (ex. user A).
   - Navigateur B : onglet ou fenêtre privée, `http://localhost:4200`, se connecter avec un autre compte (ex. user B).
   - Vérifier : pas d’erreur dans la console (F12), éventuel message "Reconnexion au serveur…" puis plus rien ou "Connected".

2. **Chat après recherche**
   - A : aller sur la page Chat (lien "Chat" dans la nav).
   - A : dans la barre de recherche, taper le nom (ou une partie) de B.
   - A : cliquer sur la **ligne** du résultat (nom de B), pas sur "Ajouter ami".
   - **Attendu** : la zone de chat à droite s’affiche immédiatement avec l’en-tête de B, historique chargé si une conversation existe, sinon "Aucun message" et champ "Écris un message..." actif.
   - A : cliquer à nouveau sur B dans la recherche (ou rafraîchir la liste puis recliquer).
   - **Attendu** : le chat reste affiché, pas de plantage ni état cassé.

3. **Messages temps réel**
   - A : taper un message et envoyer.
   - **Attendu** : le message apparaît tout de suite chez A (optimistic UI), puis confirmé (sans doublon).
   - B : sans recharger la page, le message doit apparaître en temps réel.
   - B : répondre.
   - **Attendu** : la réponse apparaît immédiatement chez B et en temps réel chez A.
   - Vérifier : pas de duplication de messages après envoi ou réception.

4. **Invitation « Ajouter ami »**
   - A : dans la recherche, trouver un autre utilisateur C (ou B si besoin).
   - A : cliquer sur le bouton **"Ajouter ami"** (icône person_add + texte) à droite de la ligne de C.
   - **Attendu** : message du type "Invitation envoyée...".
   - C (ou B) : sans recharger, **attendu** une notification / message du type "Vous avez reçu une nouvelle invitation" (ou onglet Invitations mis à jour en temps réel).
   - C : aller dans l’onglet "Invitations", voir l’invitation de A, cliquer "Accepter".
   - **Attendu** : chez A, notification en temps réel du type "… a accepté votre invitation" et la conversation avec C apparaît dans la liste (ou reste sélectionnée).
   - (Optionnel) A envoie une invitation à un autre user D, D clique "Refuser".
   - **Attendu** : A reçoit en temps réel un message du type "Votre invitation a été refusée."

5. **Liste « Amis »**
   - Après acceptation (étape 4), **attendu** : la conversation avec l’utilisateur accepté apparaît dans la liste des conversations (onglet "Tous" / "Privé") pour les deux (A et C).

---

## Résumé des vérifications

| Scénario | Résultat attendu |
|----------|------------------|
| Clic sur un user dans la recherche | Zone chat visible tout de suite, historique chargé si existe, champ message actif |
| Envoi message (A → B) | Affichage immédiat chez A, réception en temps réel chez B, pas de doublon |
| Réponse (B → A) | Réception en temps réel chez A |
| Clic "Ajouter ami" | Destinataire reçoit l’invitation en temps réel (WS) |
| Accepter l’invitation | Émetteur reçoit "accepted" en temps réel, conversation dans la liste |
| Refuser l’invitation | Émetteur reçoit "refused" en temps réel |

---

## En cas de problème

- **Chat ne s’ouvre pas au clic** : vérifier que le clic est bien sur la ligne (nom de l’utilisateur), pas uniquement sur "Ajouter ami". Vérifier la console (erreurs réseau, 404 sur `conversations/between/...`).
- **Messages pas en temps réel** : vérifier que le backend tourne sur le port attendu (8092), pas de blocage CORS, console navigateur (WebSocket connecté). Vérifier les logs backend lors de l’envoi d’un message (push WS).
- **Invitations pas en temps réel** : idem, vérifier WS et abonnements `/queue/invitations/`, `/queue/invitation-accepted/`, `/queue/invitation-rejected/`.
- **401/403 sur WS** : le handshake actuel utilise `?userId=...` en query. Si tu actives l’auth JWT plus tard, il faudra adapter le handshake pour lire le token et associer le `userId` de façon sécurisée.
