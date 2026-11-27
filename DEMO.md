# Démonstration de la soutenance finale

Séquence exacte jouée en direct, en 15 minutes, sur Base Sepolia. Elle montre le parcours complet, la fonctionnalité décentralisée (les fonds ne bougent que selon les règles, sans intermédiaire), un refus du contrat affiché dans l’interface, et l’explorateur. À répéter deux fois sur le testnet avant la soutenance, dont une fois la veille, depuis un profil de navigateur propre.

## Ce qui est utilisé

| | Valeur |
|---|---|
| Contrat | `RentalDeposit` sur Base Sepolia : [`0x4b7F624b7e4c30F825e7f106b8FF5F29c324504C`](https://sepolia.basescan.org/address/0x4b7F624b7e4c30F825e7f106b8FF5F29c324504C#code), code vérifié |
| Délais | 120 secondes chacun (réclamation, réponse, arbitrage), fixés au déploiement par `ignition/parameters/demo.json` |
| Frontend | `cd frontend && npm ci && npm run dev`, puis http://localhost:5173 |
| Propriétaire | `0x72A9C524C87555b5773f5E91084055e5d4356C1A` |
| Locataire | `0xdbb1A0eaC7116cb06464c4BfC062CfA734d777f3` |
| Arbitre | `0xC436AC46b8e4362091c7E2e9d8519FB588c8692c` |

Les trois comptes sont des comptes du **même** MetaMask (menu des comptes, « Ajouter un compte ») : on passe de l’un à l’autre en un clic. L’arbitre ne signe qu’à l’étape 5.

## La veille : préparer

1. **Financer les comptes** avec de l’ETH de test Base Sepolia : environ 0,001 ETH pour le propriétaire et le locataire, 0,0002 ETH pour l’arbitre (frais seulement). La caution d’un bail de démonstration est de 0,0001 ETH.
2. **Préparer deux baux** dont les délais seront déjà expirés le jour même. Avec le compte propriétaire, créer chaque bail avec une fin dans 3 minutes ; avec le compte locataire, le verser.
   - **Bail P1, « propriétaire silencieux »** : ne rien faire de plus. Sa fenêtre de réclamation sera expirée.
   - **Bail P2, « réclamation sans réponse »** : après la fin du bail, réclamer 0,00004 ETH avec un fichier quelconque, puis ne rien faire. La fenêtre de réponse du locataire sera expirée.
3. Noter les numéros de P1 et P2 ici : P1 = …, P2 = …
4. Préparer un fichier quelconque (un PDF ou une image) servant de justificatif.

## Juste avant : installer (minutes 0 à 5 de la soutenance)

- Le README ouvert sur le dépôt, au commit défendu.
- [Le contrat sur Basescan](https://sepolia.basescan.org/address/0x4b7F624b7e4c30F825e7f106b8FF5F29c324504C#events), onglet **Events**.
- Le frontend ouvert dans **deux fenêtres** de navigateur côte à côte (pas deux onglets), MetaMask connecté sur **Base Sepolia**.

## En direct

### 1. Créer et verser un bail (2 min)

1. Compte **propriétaire**, « Créer un bail » : locataire et arbitre ci-dessus, caution `0,0001`, fin du bail **dans 4 minutes**, le fichier en justificatif d’entrée.
2. Montrer que la confirmation donne un numéro de bail, lu dans l’événement `LeaseCreated`, et que seule l’empreinte du fichier est enregistrée.
3. Compte **locataire**, fiche du bail, « Verser 0,0001 ETH ».
4. Vue d’ensemble : « Détenu par le contrat » augmente de 0,0001 ETH. Basescan : événements `LeaseCreated` et `LeaseFunded`.

Ce bail sert aux étapes 4 et 5, une fois sa date de fin passée.

### 2. La fonctionnalité décentralisée : le propriétaire ne peut pas garder la caution en se taisant (3 min)

1. Compte **locataire**, fiche du **bail P1** : la réclamation est indiquée « délai expiré ».
2. Cliquer « Délai expiré : rendre la caution au locataire ».
3. Basescan : événement `DepositReleased` avec `afterTimeout = true`. Personne n’a eu à accepter quoi que ce soit, et le propriétaire ne peut plus réclamer.
4. Vue d’ensemble : « Retirer 0,0001 ETH ». Basescan : `Withdrawn`.

Phrase clé : avec une plateforme ou un propriétaire qui détient la caution, le silence lui profite ; ici, il profite au locataire, et n’importe qui peut faire appliquer la règle.

### 3. Un refus du contrat, affiché dans l’interface (2 min)

Sur le **bail P2**, dont la réclamation n’a pas reçu de réponse dans le délai :

1. Dans les **deux fenêtres**, compte **locataire**, ouvrir la fiche du bail P2. Elle propose « Accepter la réclamation » et « Délai expiré : attribuer la réclamation au propriétaire ».
2. Fenêtre de gauche : cliquer « Délai expiré : attribuer la réclamation au propriétaire ». Attendre la confirmation.
3. Fenêtre de droite, sans la recharger : cliquer « Accepter la réclamation ».
4. Le contrat refuse l’appel : la page affiche « Le bail n’est plus dans l’état attendu. Rechargez la page. » C’est l’erreur `WrongStatus` du contrat, décodée lors de la simulation, avant toute signature et sans frais.

Refus de secours, si le jury en demande un autre : l’interface masque les actions interdites, donc le plus direct est Basescan, onglet **Write Contract** : connecter le compte arbitre et appeler `withdraw` (`NothingToWithdraw`), ou `releaseAll` sur un bail dont il n’est pas le propriétaire (`NotLandlord`). Le formulaire de réclamation refuse aussi un montant supérieur à la caution, mais c’est la page qui refuse, avant le contrat.

### 4. Réclamation partielle sur le bail de l’étape 1 (2 min)

Une fois la fin du bail passée (compte à rebours sur la fiche) :

1. Compte **propriétaire**, formulaire « Réclamer » : `0,00004`, et le fichier en justificatif.
2. Compte **locataire** : la fiche indique « Déjà rendu au locataire : 0,00006 ETH », et la vue d’ensemble affiche un solde à retirer de 0,00006 ETH. La part non réclamée est rendue au moment même de la réclamation : personne ne peut la retenir.

### 5. Contestation et arbitrage (3 min)

1. Compte **locataire**, dans les 2 minutes qui suivent la réclamation : « Contester devant l’arbitre ».
2. Compte **arbitre**, page « Arbitrage » : le litige apparaît. Ouvrir la fiche, « Part du propriétaire » : `0,00001`, « Trancher le litige ».
3. Basescan : `DisputeResolved` avec 0,00001 ETH au propriétaire et 0,00003 ETH au locataire. L’arbitre n’a touché qu’aux 0,00004 ETH contestés, jamais à la part déjà rendue.
4. Chacun retire depuis la vue d’ensemble ; « Détenu par le contrat » redescend.

### 6. L’explorateur (1 min)

Sur Basescan : le code vérifié (onglet **Contract**), les transactions de la démonstration, et l’onglet **Events** avec `LeaseCreated`, `LeaseFunded`, `DepositReleased`, `DepositClaimed`, `ClaimDisputed`, `DisputeResolved` et `Withdrawn`.

## Si Base Sepolia ne répond pas

Le dire au jury, puis basculer sur un nœud local, avec le même module Ignition et les mêmes délais :

```sh
# Terminal 1, à la racine du dépôt
npx hardhat node

# Terminal 2, à la racine du dépôt
npx hardhat ignition deploy ignition/modules/RentalDeposit.ts --network localhost --parameters ignition/parameters/demo.json

# Terminal 3
cd frontend && VITE_CHAIN=local npm run dev
```

- Le contrat local est à `0x5FbDB2315678afecb367f032d93F642f64180aa3`, l’adresse du premier contrat déployé par le compte #0 d’un nœud neuf.
- Dans MetaMask : ajouter le réseau `http://127.0.0.1:8545`, chain id `31337`, puis importer les comptes #0 (propriétaire), #1 (locataire) et #2 (arbitre) avec les clés affichées par `npx hardhat node`. Ces clés sont publiques : elles ne doivent jamais recevoir de vrais fonds.
- La page affiche « Nœud local Hardhat » à la place de Base Sepolia. Il n’y a pas d’explorateur : les événements se lisent dans le terminal du nœud.
- Sur un nœud neuf, rien n’est préparé : jouer les étapes 1, 4 et 5, et montrer l’expiration des délais sur un bail créé au début.

## Transactions des répétitions

Répétition du 27 novembre 2026, sur Base Sepolia (bail n°2, propriétaire silencieux) :

| Étape | Transaction | Résultat |
|---|---|---|
| Délai de réclamation expiré | [`0x541d…2a84`](https://sepolia.basescan.org/tx/0x541d955a626da14ac0652e1236f2bb4ae79ea35c878dd13bfa3af3330c572a84) | `DepositReleased`, `afterTimeout = true` |
| Retrait du locataire | [`0xbbd9…6325`](https://sepolia.basescan.org/tx/0xbbd907f5984db2787b9755ec7aed3a40e6ae5c38fed550e281d9dc63f6ec6325) | `Withdrawn`, le contrat revient à 0 ETH |

Bail n°1 : création [`0x4bbb…19ff`](https://sepolia.basescan.org/tx/0x4bbb973746df1b8009c99eed13ea9b98fb56d4a1ec3d438ab64f9a12e65b19ff), versement [`0xc31e…7a1b`](https://sepolia.basescan.org/tx/0xc31e2e6a7b98aaa1271966c62ae4e1c29ba3ff2659896fbc3ad5edeb79dd7a1b), restitution [`0xb0d5…b116`](https://sepolia.basescan.org/tx/0xb0d589c599d0842da1cd4acdffc50952daeb3730ff24027bcea0dfff2a12b116), retrait [`0x2680…dd06`](https://sepolia.basescan.org/tx/0x26808fb134b44520e61e221e4aaa50495342daed2cae6b3ac44de663db1ddd06).

Le compte locataire de ces répétitions est un compte MetaMask converti en compte intelligent (EIP-7702) : ses transactions sont relayées, et Basescan affiche un autre expéditeur. Les événements du contrat montrent bien le locataire comme bénéficiaire.
