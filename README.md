# Caution — dépôt de garantie locative sur blockchain

Projet du module « Blockchain & Decentralised Applications » (EPITECH, sujet escrow). Le locataire bloque la caution dans un contrat que personne ne contrôle ; à la fin du bail, le propriétaire réclame tout ou partie de la caution sur justificatifs, et un arbitre désigné à la création tranche le montant contesté.

**État actuel** : le projet Hardhat 3 est initialisé, mais le contrat de caution reste à écrire (les fichiers `Counter` sont les exemples du template). Le frontend est encore une **démonstration simulée** : les baux, portefeuilles, soldes et actions sont fictifs, sans RPC ni transaction blockchain.

## Organisation du dépôt

```text
contracts/            contrats Solidity (et tests Solidity *.t.sol)
test/                 tests TypeScript (node:test + viem)
ignition/modules/     modules de déploiement Hardhat Ignition
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
npx hardhat test nodejs test/Counter.ts   # un seul fichier de test TypeScript
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

Ils ne servent qu’au déploiement sur Base Sepolia, pas aux tests locaux :

```sh
npx hardhat ignition deploy ignition/modules/<Module>.ts --network baseSepolia --verify
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

## Parcours du frontend de démonstration

- Tableau de bord : montants, baux et réclamation à examiner.
- Baux : recherche, filtres par état, détail et historique.
- Création : libellé privé, caution, date de fin, adresses fictives du locataire et de l’arbitre.
- Choix du rôle pour explorer le financement, la restitution, les réclamations et la résolution des litiges.
- Le bouton de portefeuille connecte un **compte de démonstration**, sans extension.
- Les baux sont enregistrés dans le `localStorage` de ce navigateur. Le solde et la connexion sont conservés uniquement pendant la session de la page. « Comprendre Caution » permet de réinitialiser le scénario.

## Scénario de découverte (démonstration)

1. Connecter le portefeuille fictif.
2. Dans le rôle Locataire, ouvrir le Studio de Lyon et contester la réclamation.
3. Choisir Arbitre, ouvrir le litige et répartir le montant contesté.
4. Choisir Propriétaire, créer un bail avec deux adresses de test distinctes au format `0x` suivi de 40 caractères hexadécimaux.
5. Choisir Locataire, filtrer « À financer », ouvrir le bail et simuler le versement.

## Limites et suite

Les rôles ne sont pas authentifiés, les délais ne sont pas exécutés automatiquement, et les justificatifs sont fictifs. Les adresses saisies lors de la création servent à valider le formulaire, sans être stockées ni utilisées comme autorisation. Les adresses du propriétaire et du contrat ne sont pas encore modélisées. Les actions de dépassement de délai restent à intégrer avec le contrat final. Le prototype ne constitue pas une implémentation financière ni une preuve de décentralisation.

L’intégration future pourra utiliser wagmi et viem sur **Base Sepolia uniquement**, avec des états explicites de connexion, lecture, signature, confirmation et erreur. Aucun secret n’est nécessaire au frontend de démonstration.

## Organisation du frontend

```text
frontend/src/
├── main.tsx                 # Point d’entrée React
├── App.tsx                  # Assemblage de l’interface et des modales
├── components/
│   ├── layout/              # Navigation, en-tête, rôle, pied de page
│   ├── dashboard/           # Indicateurs et alerte de réclamation
│   ├── leases/              # Liste, ligne, création, détail et actions
│   ├── help/                # Explication du fonctionnement
│   └── ui/                  # Modale et notification réutilisables
├── hooks/                   # État de démonstration et notifications
├── services/                # Accès au stockage local des baux
├── data/                    # Jeu de données de démonstration
├── types/                   # Types partagés : bail, rôle, état et page
├── utils/                   # Formatage des dates et montants
└── styles/                  # Base, layout, composants et responsive
```

Les composants reçoivent des propriétés typées et ne lisent pas directement le stockage, hormis la commande explicite de réinitialisation qui passe par le service. `useDemoApp` centralise les transitions simulées ; `leaseStorage` isole leur persistance pour préparer une future source de données. Les champs temporaires des formulaires d’actions restent dans `LeaseActions`. `useNotification` gère la durée des notifications et nettoie son minuteur au démontage.

Pour faire évoluer un écran, modifier son composant et sa feuille de style dédiée. Pour modifier une transition de démonstration, intervenir dans `hooks/useDemoApp.ts`. Pour changer les exemples, modifier `data/demoLeases.ts`. Les composants `Modal` et `Toast` restent indépendants du domaine locatif.
