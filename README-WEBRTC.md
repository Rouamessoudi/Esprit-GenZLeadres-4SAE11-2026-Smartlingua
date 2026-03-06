# Appels audio / vidéo WebRTC (SmartLingua)

Les appels 1-to-1 (audio et vidéo) utilisent **WebRTC** avec le **WebSocket existant** (STOMP) comme serveur de signalisation. Le chat reste inchangé (REST + polling).

---

## Comment tester en 2 navigateurs

1. **Démarrer le backend** (port 8092) et le **frontend** (port 4200).
2. **Ouvrir deux fenêtres** (ou un navigateur + une fenêtre privée) sur **http://localhost:4200**.
3. **Fenêtre A** : créer un compte ou se connecter (ex. `user1` / `user1@test.com`).
4. **Fenêtre B** : créer un autre compte ou se connecter (ex. `user2` / `user2@test.com`).
5. Dans les deux fenêtres, aller dans **Chat** puis cliquer sur **« + Nouvelle conversation »**.
6. **Fenêtre A** : dans la liste des utilisateurs, repérer **user2** (pastille verte = en ligne). Cliquer sur **📞 Audio** ou **🎥 Vidéo** pour lancer un appel.
7. **Fenêtre B** : une modal **« Appel entrant… »** s’affiche. Cliquer sur **Accepter** (ou **Refuser**).
8. Une fois en communication : tester **Raccrocher**, **Couper le micro**, **Couper la caméra** (si appel vidéo).

---

## États affichés

| État      | Signification                          |
|----------|----------------------------------------|
| calling… | Vous avez lancé l’appel, en attente.   |
| ringing… | Appel entrant (sonnerie).               |
| in call  | En communication (durée affichée).     |
| ended    | Appel terminé (raison affichée).       |

Si l’autre utilisateur est **hors ligne** (pas sur la page Chat / pas de WebSocket), vous verrez **« Utilisateur hors ligne »** après quelques secondes.

---

## Fichiers concernés

- **Backend** : `WebSocketConfig.java` (HandshakeHandler `userId`), `UserIdHandshakeHandler.java`, `CallSignalController.java` (routage `/app/call.signal` → `/queue/call`).
- **Frontend** : `webrtc-call.service.ts`, `call-store.ts`, `call-modal.component.*`, `chat-sidebar` (boutons 📞 / 🎥), `chat.component` (intégration modal + `webrtc.connect`).

---

## Contraintes

- **Un seul appel actif** à la fois (un nouvel appel est ignoré si un appel est déjà en cours).
- **STUN** par défaut : `stun:stun.l.google.com:19302` (pas de TURN ; peut ne pas passer à travers certains pare-feu/NAT).
- **HTTPS** : en production, utiliser `wss://` et `https://` pour le front ; le backend doit exposer le WebSocket en sécurisé.
