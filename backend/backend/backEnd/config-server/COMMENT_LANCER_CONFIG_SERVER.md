# Lancer le Config Server

## config-server n’apparaît pas dans Maven

Si dans le panneau **Maven** tu vois apiGateway, courses, eureka, etc. mais **pas config-server**, tu peux faire l’un des deux suivants.

---

## 1. Ajouter le projet Maven config-server

1. Dans le panneau **Maven** (à droite), clique sur l’icône **« Load Maven Projects »** (dossier avec une flèche vers le bas) ou sur **+** (Add Maven Projects).
2. Dans la fenêtre qui s’ouvre, va jusqu’au dossier :  
   **`C:\pi\backend\backend\backEnd\config-server`**
3. Sélectionne le fichier **`pom.xml`** dans ce dossier.
4. Clique sur **OK** (ou **Open**).
5. Attends que Maven charge le projet. **config-server** devrait apparaître dans la liste Maven.
6. Déplie **config-server** → **Plugins** → **spring-boot**.
7. **Double-clique** sur **spring-boot:run** pour lancer le Config Server.

---

## 2. Lancer avec la configuration Application (sans Maven)

Si tu as déjà créé une configuration **ConfigServerApplication** avec la classe principale **esprit.configserver.ConfigServerApplication** et le module **apiGateway** :

1. En haut, ouvre la liste à côté du bouton **Play vert**.
2. Choisis **ConfigServerApplication**.
3. Clique sur le **bouton Play vert**.

Le Config Server doit démarrer sur le port **8888**. Vérifie dans le navigateur : **http://localhost:8888/courses/default**
