# Caution — dépôt de garantie locative sur blockchain

Projet du module « Blockchain & Decentralised Applications » (EPITECH, sujet escrow). Le locataire bloque la caution dans un contrat que personne ne contrôle ; à la fin du bail, le propriétaire réclame tout ou partie de la caution sur justificatifs, et un arbitre désigné à la création tranche le montant contesté.

**État actuel** : le squelette du contrat `contracts/RentalDeposit.sol` est en place (types, délais, événements, erreurs, `withdraw`). Les transitions du bail sont déclarées mais revert encore avec `NotImplemented` : chaque partie les écrit avec ses tests. La connexion à un portefeuille navigateur est réelle (wagmi + viem). Les données et opérations des baux ne sont pas encore reliées au contrat : le frontend affiche des états indisponibles, sans exemples fictifs ni actions simulées.

## Fonctionnalité décentralisée

Réponse à la question du module : « remplacez la blockchain par une base de données et un administrateur de confiance : qu’est-ce qui casse ? »

1. **La fonctionnalité.** Une caution versée dans le contrat ne peut sortir que par l’une des issues prévues par ses règles publiques : restitution, réclamation acceptée, arbitrage ou délai expiré.
2. **La version centralisée.** Une plateforme qui garde la caution sur son compte peut la conserver, la dépenser, la geler, la rendre en retard, retenir un montant arbitraire, ou la perdre si elle fait faillite. Ici, personne, ni le propriétaire ni le déployeur, ne peut déplacer les fonds en dehors des transitions du contrat, et la part non réclamée revient au locataire au moment même de la réclamation.
3. **Qui est protégé.** Le locataire en fin de bail, face à un propriétaire qui garde la caution sans justification ou qui ne répond plus. Le propriétaire aussi, face à un locataire qui ne répond pas : passé le délai, la réclamation lui est acquise sans intermédiaire.
4. **Ce qui reste de confiance.**
   - **L’arbitre**, choisi par le propriétaire à la création et accepté par le locataire quand il verse la caution. Il ne peut répartir que le montant contesté, dans le délai d’arbitrage. S’il est malhonnête, il peut attribuer au propriétaire jusqu’à la totalité de ce montant ; s’il disparaît, le montant contesté revient au locataire.
   - **Les justificatifs.** La chaîne fixe leur hash (`leaseHash`, `claimHash`), pas leur vérité : elle ne sait pas si l’appartement est abîmé. C’est le problème de l’oracle, et c’est la raison d’être de l’arbitre. Les documents eux-mêmes sont stockés hors chaîne, par les parties.
   - **Le réseau Base** et son séquenceur, exploité par une seule entreprise : il ordonne les transactions et fixe l’horodatage des blocs, à quelques secondes près.
   - **Le déployeur**, uniquement au déploiement : il fixe les trois délais, identiques pour tous les baux, puis n’a plus aucun pouvoir.

Le système n’est donc pas « entièrement décentralisé » : il supprime la confiance dans une plateforme qui détiendrait les fonds, et la remplace par une confiance limitée et écrite, détaillée ci-dessous.

## Rôles et confiance

| Rôle | Peut | Ne peut pas | S’il triche ou disparaît |
|---|---|---|---|
| **Propriétaire** | créer un bail (il en devient le propriétaire) ; l’annuler tant qu’il n’est pas financé ; tout rendre au locataire ; réclamer tout ou partie de la caution après `endDate`, dans `claimWindow`, avec le hash des justificatifs | toucher la caution pendant le bail ; réclamer avant `endDate`, après `claimWindow` ou plus que la caution ; réclamer deux fois ; choisir le résultat d’un litige | s’il ne réclame pas à temps, n’importe qui déclenche `refundAfterTimeout` et toute la caution revient au locataire |
| **Locataire** | verser le montant exact de la caution ; accepter la réclamation ; la contester dans `responseWindow` ; retirer son solde | reprendre la caution avant la fin du bail ou avant l’issue de la réclamation ; contester hors délai ; financer un bail dont il n’est pas le locataire | s’il ne répond pas à temps, n’importe qui déclenche `acceptAfterTimeout` et le montant réclamé revient au propriétaire |
| **Arbitre** | répartir le montant contesté entre propriétaire et locataire, dans `arbitrationWindow` | toucher la part non contestée (déjà rendue au locataire) ; agir sur un bail qui n’est pas en litige ; agir hors délai ; attribuer au propriétaire plus que `claimAmount` | malhonnête : il peut donner jusqu’à tout le montant contesté à l’un des deux, c’est la confiance résiduelle ; absent : n’importe qui déclenche `resolveAfterTimeout` et le montant contesté revient au locataire |
| **N’importe qui** | déclencher un délai expiré ; lire tout bail et tout événement | déclencher un délai avant son expiration ; envoyer des fonds ailleurs que prévu par la règle du délai | sans effet : le résultat d’un délai est le même quel que soit l’appelant |
| **Déployeur** | fixer `claimWindow`, `responseWindow` et `arbitrationWindow` au déploiement | tout le reste : pas d’`owner`, pas de pause, pas de mise à jour du code, pas de retrait d’urgence | sans effet après le déploiement ; des délais trop courts seraient visibles par tous avant de verser une caution |
| **Réseau Base (séquenceur)** | ordonner les transactions, fixer l’horodatage des blocs | modifier les règles du contrat ou les soldes | une panne retarde les transactions ; une dérive de l’horodatage de quelques secondes est négligeable face à des délais de 14 à 60 jours |
| **Émetteur de jeton** | — | — | sans objet : la caution est en ETH natif, aucun émetteur ne peut geler les fonds (un stablecoin en euros réintroduirait ce rôle) |

Règles qui découlent du tableau :

- **Le silence ne profite jamais à celui qui se tait.** Chaque délai a une issue par défaut, déclenchable par n’importe qui : propriétaire silencieux, tout au locataire ; locataire silencieux, réclamation acquise ; arbitre silencieux, montant contesté au locataire, car c’est au propriétaire qui réclame d’apporter la preuve.
- **Délais.** Une action « dans le délai » est permise tant que `block.timestamp <= deadline`, la fonction `...AfterTimeout` correspondante seulement après : les deux ne sont jamais possibles en même temps. En production, 60 jours pour réclamer, 14 pour répondre et 30 pour trancher, inspirés de l’article 22 de la loi du 6 juillet 1989 ; 2 minutes chacun pour la démonstration (`ignition/parameters/demo.json`).
- **Arbitre fixé par bail.** Il est désigné à la création, distinct du propriétaire et du locataire, et ne peut plus changer. Le locataire le connaît avant de verser la caution : verser, c’est l’accepter.
- **Une seule réclamation par bail**, pas de fin anticipée dans cette version.
- **Aucune donnée personnelle sur la chaîne** : ni nom ni adresse postale, seulement des adresses Ethereum et des hashes.

## Revue de sécurité : catalogue des failles

Chaque famille de failles vue au Day 3, appliquée à `RentalDeposit`.

| Faille | Statut | Justification |
|---|---|---|
| Contrôle d’accès | traité | chaque transition vérifie le rôle de l’appelant dans le contrat (`NotLandlord`, `NotTenant`, `NotArbiter`), jamais seulement dans le frontend ; aucun rôle d’administration |
| Réentrance | traité | seul `withdraw` envoie de l’ETH : solde remis à zéro avant l’envoi (checks-effects-interactions), `nonReentrant`, envoi par `call` ; les transitions ne font que créditer des soldes, sans appel externe |
| Arithmétique | traité | Solidity 0.8 (dépassement = revert) ; uniquement des soustractions bornées en amont : `deposit - claimAmount` (`InvalidClaimAmount`), `claimAmount - toLandlord` (`InvalidSplit`) ; aucune division, donc aucun arrondi |
| Manipulation d’oracle | non applicable | le contrat ne lit aucun prix ; la seule source extérieure est l’arbitre, humain, limité au montant contesté et inscrit dans le tableau des rôles |
| Front-running, MEV | non applicable | rien ne récompense le premier arrivé, et un délai expiré donne le même résultat quel que soit l’appelant ; côté frontend, l’identifiant d’un nouveau bail est lu dans l’événement `LeaseCreated`, jamais déduit de `leaseCount`, car un autre bail peut être créé entre-temps |
| Rejeu de signature | non applicable | aucune signature hors chaîne n’est vérifiée par le contrat |
| Déni de service | traité | aucune boucle ni tableau extensible ; chaque bail est indépendant (identifiant propre) ; paiements par retrait, donc un destinataire dont le `receive` échoue ne bloque que son propre retrait |
| ETH forcé dans le contrat | traité | pas de `receive` : un virement simple est refusé ; et la comptabilité repose sur `balances` et `deposit`, jamais sur `address(this).balance`, donc de l’ETH forcé (`selfdestruct`) ne change aucune règle |
| Aléatoire | non applicable | le contrat n’utilise aucun aléa |
| `delegatecall`, proxy | non applicable | contrat immuable, sans proxy ni mise à jour, par choix : un contrat modifiable rendrait le pouvoir à un opérateur |
| Horodatage (`block.timestamp`) | accepté | le séquenceur peut décaler l’horodatage de quelques secondes, négligeable face aux délais de production ; avec les délais de démonstration de 2 minutes, l’effet est visible et doit être présenté comme tel |
| Choix de l’arbitre | accepté | désigné par le propriétaire ; le contrat interdit seulement qu’il soit le propriétaire ou le locataire. Le risque maximal pour le locataire est la perte du montant contesté, et il connaît l’arbitre avant de verser |
| Côté utilisateur | à faire (frontend) | afficher l’arbitre, la caution exacte et la date de fin avant la signature de `fund`, et ne demander aucune signature que l’interface n’explique pas |

Les transitions étant encore en cours d’implémentation, chaque ligne « traité » doit être couverte par un test avant la soutenance intermédiaire, dont le test d’attaque par réentrance sur `withdraw` (partie 2).

## Organisation du dépôt

```text
contracts/            contrats Solidity (et tests Solidity *.t.sol)
test/                 tests TypeScript (node:test + viem)
ignition/modules/     modules de déploiement Hardhat Ignition
ignition/parameters/  paramètres de déploiement (demo.json : délais de 2 minutes)
ignition/deployments/ adresses déployées par réseau (versionnées)
scripts/              scripts lancés avec `npx hardhat run`
hardhat.config.ts     compilateur, réseau baseSepolia, vérification
frontend/             application React (projet npm séparé)
docs/                 documentation (synchronisation du dépôt, design)
```

Stack contrats : Hardhat 3 (template `node-test-runner-viem`), viem, Solidity 0.8.34, tests avec le test runner natif de Node, déploiement avec Ignition. Réseau cible : **Base Sepolia uniquement** (chain id 84532).

## Démarrer

Node.js 22.13+ ou 24 recommandé. Le dépôt contient deux projets npm indépendants : les contrats (Hardhat 3, à la racine) et le frontend (`frontend/`). Il faut lancer `npm ci` dans les deux.

Contrats :

```sh
npm ci
npx hardhat compile
npx hardhat test                          # tests Solidity et TypeScript
npx hardhat test nodejs test/RentalDeposit.ts   # un seul fichier de test TypeScript
npx hardhat test solidity                 # tests Solidity uniquement
```

Le fichier `.npmrc` de la racine contient `allow-git=root` : npm 12 refuse par défaut les dépendances git, or `forge-std` (bibliothèque des tests Solidity) est installé depuis GitHub.

### Secrets et déploiement

Les secrets ne sont jamais écrits dans un fichier du dépôt ni dans un `.env` : ils sont stockés chiffrés dans le keystore de Hardhat. La valeur se saisit à l’invite, jamais dans la commande :

```sh
npx hardhat keystore set BASE_SEPOLIA_RPC_URL
npx hardhat keystore set BASE_SEPOLIA_PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY
```

Ils ne servent qu’au déploiement sur Base Sepolia, pas aux tests locaux. Sans fichier de paramètres, le module utilise les délais de production (60, 14 et 30 jours) ; `demo.json` les remplace par 2 minutes pour la soutenance :

```sh
npx hardhat ignition deploy ignition/modules/RentalDeposit.ts --network baseSepolia --parameters ignition/parameters/demo.json --verify
```

Frontend :

```sh
cd frontend
npm ci
npm run dev
npm run build   # TypeScript puis build Vite dans frontend/dist/
npm run preview
```

Stack frontend : React 19, TypeScript, Vite 7, Tailwind CSS 4, Motion et Lucide. `src/main.tsx` monte l’application ; `src/App.tsx` assemble les composants. Les styles importent Tailwind via son plugin Vite.

## Frontend sans données fictives

La connexion du portefeuille fonctionne sur **Base Sepolia (84532)** avec wagmi 3, viem et TanStack Query. Les extensions injectées et la découverte EIP-6963 sont prises en charge, sans identifiant de projet ni secret. WalletConnect et les connexions mobiles par QR code ne sont pas intégrés.

Le menu affiche l’adresse réelle et le réseau, propose de passer sur Base Sepolia et permet la déconnexion. Les changements de compte et de réseau sont suivis par wagmi. La reconnexion dépend de l’autorisation conservée par l’extension.

**Partie 1 reliée au contrat.** Le frontend lit les baux (`leaseCount`, puis `getLease` en un seul appel multicall) et affiche ceux où l’adresse connectée est propriétaire, locataire ou arbitre. Les rôles viennent des adresses enregistrées dans le contrat, jamais d’un sélecteur. Trois actions sont des transactions réelles, confirmées dans le portefeuille :

- **Créer un bail** (propriétaire) : adresses du locataire et de l’arbitre, caution, date de fin, et le fichier du bail et de l’état des lieux d’entrée. Le fichier reste sur l’appareil : seule son empreinte keccak256 est envoyée (`leaseHash`). L’identifiant du bail créé est lu dans l’événement `LeaseCreated`.
- **Verser la caution** (locataire) : le montant exact, après affichage de l’arbitre, de la caution et de la date de fin.
- **Annuler le bail** (propriétaire), tant qu’il n’est pas financé.

Chaque transaction est simulée avant la signature : un refus du contrat est décodé et affiché avec sa raison (`NotTenant`, `EndDateInPast`…), sans frais. Une lecture qui échoue s’affiche comme un échec, jamais comme une liste vide ou un solde nul ; un tiret signifie « indisponible ».

Tant que l’adresse du contrat n’est pas renseignée dans `frontend/src/config/contract.ts`, les baux sont indisponibles et la création est désactivée. Après un déploiement, recopier l’adresse depuis `ignition/deployments/chain-84532/deployed_addresses.json`. Si les signatures du contrat changent : `npx hardhat compile` à la racine, puis `npm run abi` dans `frontend/`.

Les soldes, réclamations et litiges (parties 2 et 3) restent indisponibles. Aucun bail d’exemple, faux solde ou simulation de transaction n’est conservé dans le code applicatif.

## Organisation du frontend

```text
frontend/src/
├── main.tsx             # WalletProvider puis AppContextProvider
├── App.tsx              # Assemblage des écrans et de l’aide
├── components/
│   ├── dashboard/       # Indicateurs indisponibles jusqu’aux lectures du contrat
│   ├── leases/          # État indisponible des baux et litiges
│   ├── layout/          # Navigation, en-tête et explication du projet
│   ├── help/            # Fonctionnement prévu du contrat
│   ├── wallet/          # Connexion réelle et gestion du portefeuille
│   └── ui/              # Modale réutilisable
├── config/              # Configuration wagmi sur Base Sepolia uniquement
├── contexts/            # État d’interface : page, menu mobile et aide
├── providers/           # Providers wagmi et TanStack Query
├── types/               # Types de navigation
├── utils/               # Messages d’erreur du portefeuille
└── styles/              # Thème, composants et responsive
```

`contexts/AppContext.tsx` suit la structure type explicite → contexte → hook sécurisé → provider. `AppContextProps` déclare les champs et les setters avec `Dispatch<SetStateAction<T>>`. `useAppContext()` déclenche une erreur hors de `AppContextProvider`. Les données de connexion restent dans wagmi ; aucun setter de fausse connexion n’est exposé.

## Validation du frontend

Depuis `frontend/` :

```sh
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

Si Chromium est déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.

Les tests utilisent un portefeuille EIP-1193 simulé uniquement dans les fichiers de test, sans clé. Ils couvrent la connexion, les refus, les demandes en attente, les changements de compte et de réseau, la reconnexion, la déconnexion et l’absence de données fictives dans l’application. Une validation manuelle reste nécessaire pour les fenêtres propres à chaque extension.
