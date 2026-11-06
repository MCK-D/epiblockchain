# Équipe et répartition

Le projet est découpé en trois parties fonctionnelles. Chaque partie comprend le contrat, ses tests et les écrans du frontend correspondants. Chaque membre doit pouvoir expliquer tout le contrat, pas seulement sa partie.

## Membres

| Membre | Partie | Réalisé |
|---|---|---|
| **Arthur Guyetand** (`GUYETAND`) | 1 · création, annulation, versement | initialisation Hardhat 3 ; squelette du contrat (délais, événements, erreurs, `withdraw`) ; `createLease`, `cancel`, `fund` et leurs tests ; frontend relié au contrat (créer un bail, verser la caution, annuler) ; refonte de l’interface ; README (décentralisation, tableau des rôles, revue de sécurité) ; schémas `docs/design/` |
| **vlinka** (`vlinka`) | 2 · restitution, réclamations, délais, retrait | `releaseAll`, `claim`, `acceptClaim`, `refundAfterTimeout`, `acceptAfterTimeout`, `withdraw` ; test d’attaque par réentrance ; déploiement et vérification sur Base Sepolia |
| **Micka Daoud** (`Micka Daoud`, `MCK`) | 3 · contestation, arbitrage | base du frontend (React, Vite, contexte typé, organisation des composants) ; connexion des portefeuilles avec wagmi et viem ; retrait des données de démo ; synchronisation vers le dépôt de l’organisation |

Les fonctions `dispute`, `resolve` et `resolveAfterTimeout` ont été implémentées par vlinka (commit `feat(contracts): implement disputes and arbitration`).

## Reste à faire

| Tâche | Responsable |
|---|---|
| Frontend partie 2 : restitution, réclamation, réponse du locataire, délais, retrait | à confirmer |
| Frontend partie 3 : contestation, page de l’arbitre, historique du bail à partir des événements | à confirmer |
| `DEMO.md` : scénario exact de la soutenance finale | à confirmer |
