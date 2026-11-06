# Caution — dépôt de garantie locative sur blockchain

Projet du module « Blockchain & Decentralised Applications » (EPITECH, sujet escrow). Le locataire bloque la caution dans un contrat que personne ne contrôle ; à la fin du bail, le propriétaire réclame tout ou partie de la caution sur justificatifs, et un arbitre désigné à la création tranche le montant contesté.

**État actuel** : le squelette du contrat `contracts/RentalDeposit.sol` est en place (types, délais, événements, erreurs, `withdraw`). Les transitions du bail sont déclarées mais revert encore avec `NotImplemented` : chaque partie les écrit avec ses tests. La connexion à un portefeuille navigateur est réelle (wagmi + viem). Les données et opérations des baux ne sont pas encore reliées au contrat : le frontend affiche des états indisponibles, sans exemples fictifs ni actions simulées.

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
