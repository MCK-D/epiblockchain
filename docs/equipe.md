# Équipe et répartition

Le projet est découpé en trois parties fonctionnelles. Chaque partie comprend le contrat, ses tests et les écrans du frontend correspondants. Chaque membre doit pouvoir expliquer tout le contrat, pas seulement sa partie.

## Membres

| Membre | Partie | Réalisé |
|---|---|---|
| **Arthur Guyetand** (`GUYETAND`) | 1 · création, annulation, versement | initialisation Hardhat 3 ; squelette du contrat (délais, événements, erreurs, `withdraw`) ; `createLease`, `cancel`, `fund` et leurs tests ; frontend relié au contrat (créer un bail, verser la caution, annuler) ; refonte de l’interface ; README (décentralisation, tableau des rôles, revue de sécurité) ; schémas `docs/design/` |
| **vlinka** (`vlinka`) | 2 · restitution, réclamations, délais, retrait | `releaseAll`, `claim`, `acceptClaim`, `refundAfterTimeout`, `acceptAfterTimeout`, `withdraw` ; test d’attaque par réentrance ; déploiement et vérification sur Base Sepolia ; frontend des parties 2 et 3 (fin de bail, contestation, arbitrage, retrait, vue d’ensemble) ; tests d’invariants et de fuzzing ; CI ; secours sur nœud local ; `DEMO.md` |
| **Micka Daoud** (`Micka Daoud`, `MCK`) | 3 · contestation, arbitrage | base du frontend (React, Vite, contexte typé, organisation des composants) ; connexion des portefeuilles avec wagmi et viem ; retrait des données de démo ; synchronisation vers le dépôt de l’organisation |

Les fonctions `dispute`, `resolve` et `resolveAfterTimeout`, ainsi que leurs écrans, ont été implémentées par vlinka. Chaque membre doit pouvoir les expliquer : les relire ensemble avant la soutenance.

## Reste à faire

| Tâche | Responsable |
|---|---|
| Renseigner le compte arbitre dans `DEMO.md`, financer les trois comptes, préparer les baux P1 et P2 la veille | à confirmer |
| Répéter `DEMO.md` deux fois sur Base Sepolia, dont une fois la veille, depuis un profil de navigateur propre | les trois |
| Séance où chacun explique sa partie aux deux autres, questions comprises | les trois |
| Préparer la question « un protocole en production » : par exemple Kleros pour l’arbitrage, ce qu’il fait différemment et pourquoi | à confirmer |
| Facultatif : historique d’un bail lu depuis les événements (non fait) | à confirmer |
