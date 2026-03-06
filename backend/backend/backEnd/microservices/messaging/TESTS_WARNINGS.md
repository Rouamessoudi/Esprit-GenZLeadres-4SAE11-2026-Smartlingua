# Tests – supprimer les warnings (IntelliJ)

Si tu vois des **WARNING** dans la console lors des tests (Mockito / Byte Buddy agent, OpenJDK VM) :

## Depuis IntelliJ

1. **Run** → **Edit Configurations...**
2. Sélectionne la configuration de test (ex. « All in messaging » ou « MessagingApplicationTests »).
3. Dans **VM options** (si absent : **Modify options** → **Add VM options**), ajoute :
   ```
   -XX:+EnableDynamicAgentLoading -Xshare:off
   ```
4. **Apply** → **OK**, puis relance les tests.

## Depuis Maven

Les options sont déjà configurées dans `pom.xml` (plugin Surefire). Lance :

```bash
mvn test
```

Les warnings devraient disparaître ou être fortement réduits.
