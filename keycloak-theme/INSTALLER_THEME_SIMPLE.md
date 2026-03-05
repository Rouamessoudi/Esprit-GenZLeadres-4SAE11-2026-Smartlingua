# Guide simple : installer le thème SmartLingua dans Keycloak

Fais les étapes **dans l’ordre**. Une étape = une action.

---

## Étape 1 : Ouvre l’Explorateur de fichiers Windows

- Appuie sur **Windows + E** (ou double-clique sur « Ce PC »).
- Tu vois tes dossiers (Bureau, Documents, etc.).

---

## Étape 2 : Va dans le dossier du thème (dans ton projet)

1. Dans la barre d’adresse en haut, clique dedans.
2. Tape exactement :  
   **c:\pi\keycloak-theme**
3. Appuie sur **Entrée**.
4. Tu dois voir un dossier qui s’appelle **smartlingua**.  
   **Ne l’ouvre pas.** On va le copier.

---

## Étape 3 : Copie le dossier smartlingua

1. **Clic droit** sur le dossier **smartlingua**.
2. Clique sur **Copier**.

---

## Étape 4 : Ouvre le dossier où Keycloak est installé

Tu as lancé Keycloak avec une commande du type :  
**bin\kc.bat start-dev**  
dans un dossier. C’est **ce dossier** qu’il faut ouvrir.

**Exemple :** si tu as ouvert un terminal dans  
**C:\keycloak**  
ou  
**C:\Users\PC\keycloak**  
ou  
**C:\pi\keycloak**  
→ ouvre ce dossier dans l’Explorateur.

**Comment le trouver :**
- Regarde la fenêtre où Keycloak tourne (PowerShell ou CMD). En haut il y a souvent le chemin, par exemple :  
  **C:\keycloak-26**
- Ou cherche sur ton disque un dossier qui s’appelle **keycloak** et qui contient un dossier **bin** (avec **kc.bat** dedans).

1. Dans l’Explorateur, va dans ce dossier Keycloak (celui qui contient **bin**, **lib**, etc.).
2. Dedans, cherche le dossier **themes**.
   - S’il existe : ouvre le dossier **themes**.
   - S’il n’existe pas : clic droit dans le dossier Keycloak → **Nouveau** → **Dossier** → nomme-le **themes** → ouvre le dossier **themes**.

---

## Étape 5 : Colle le thème dans le dossier themes

1. Tu es maintenant dans :  
   **…\keycloak\themes**
2. **Clic droit** dans la fenêtre (dans le vide).
3. Clique sur **Coller**.
4. Tu dois voir apparaître le dossier **smartlingua** à côté des autres dossiers (s’il y en a).

**Vérification :** tu dois avoir ce chemin :  
**…\keycloak\themes\smartlingua**  
et dedans un dossier **login**, etc.

---

## Étape 6 : Redémarre Keycloak

1. Va dans la fenêtre où Keycloak tourne (PowerShell ou CMD).
2. Appuie sur **Ctrl + C** pour l’arrêter.
3. Relance Keycloak avec la même commande qu’avant, par exemple :  
   **bin\kc.bat start-dev --http-port 8081**
4. Attends que Keycloak ait fini de démarrer (message du type « Running » ou « started »).

---

## Étape 7 : Choisis le thème dans Keycloak

1. Ouvre ton navigateur.
2. Va sur : **http://localhost:8081/admin**
3. Connecte-toi (admin / ton mot de passe).
4. En haut à gauche, sélectionne le realm **smartlingua**.
5. Menu de gauche : clique sur **Realm settings**.
6. En haut : clique sur l’onglet **Themes**.
7. À la ligne **Login theme**, ouvre la liste (clic sur la flèche).
8. Tu dois voir **smartlingua** dans la liste. Clique sur **smartlingua**.
9. En bas de la page : clique sur **Save**.

---

## Étape 8 : Vérifier

1. Ouvre un nouvel onglet.
2. Va sur : **http://localhost:4200**
3. Clique sur **Sign In**.
4. La page de connexion Keycloak doit s’afficher avec le **fond violet/noir** et le **bouton violet** (thème SmartLingua).

Si tu ne vois pas le changement : sur la page de login, fais **Ctrl + F5** (rechargement forcé).

---

## Résumé en 3 lignes

1. **Copier** le dossier **c:\pi\keycloak-theme\smartlingua**  
2. **Coller** dans le dossier **themes** de Keycloak (dans le dossier où tu lances kc.bat)  
3. **Redémarrer** Keycloak, puis dans Admin → Realm settings → Themes → Login theme = **smartlingua** → **Save**

Si tu bloques, dis-moi à quelle étape (1, 2, 3…) et ce que tu vois à l’écran.
