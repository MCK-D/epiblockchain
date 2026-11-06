# Caution — dépôt de garantie locative sur blockchain

Projet du module « Blockchain & Decentralised Applications » (EPITECH, sujet escrow). Le locataire bloque la caution dans un contrat que personne ne contrôle ; à la fin du bail, le propriétaire réclame tout ou partie de la caution sur justificatifs, et un arbitre désigné à la création tranche le montant contesté.

**État actuel** : le squelette du contrat `contracts/RentalDeposit.sol` est en place (types, délais, événements, erreurs, `withdraw`). Les transitions du bail sont déclarées mais revert encore avec `NotImplemented` : chaque partie les écrit avec ses tests. Le frontend est encore une **démonstration simulée** : les baux, soldes et actions restent fictifs. La connexion à un portefeuille navigateur est réelle (wagmi + viem), sans signature ni transaction blockchain.

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

## Parcours du frontend de démonstration

- Tableau de bord : montants, baux et réclamation à examiner.
- Baux : recherche, filtres par état, détail et historique.
- Création : libellé privé, caution, date de fin, adresses fictives du locataire et de l’arbitre.
- Choix du rôle pour explorer le financement, la restitution, les réclamations et la résolution des litiges.
- Le bouton de portefeuille connecte un **compte de démonstration**, sans extension.
- Les baux sont enregistrés dans le `localStorage` de ce navigateur. Le solde et la connexion sont conservés uniquement pendant la session de la page. « Comprendre Caution » permet de réinitialiser le scénario.

## Scénario de découverte (démonstration)

1. Connecter une extension Ethereum installée, puis sélectionner Base Sepolia dans le menu du portefeuille.
2. Dans le rôle Locataire, ouvrir le Studio de Lyon et contester la réclamation.
3. Choisir Arbitre, ouvrir le litige et répartir le montant contesté.
4. Choisir Propriétaire, créer un bail avec deux adresses de test distinctes au format `0x` suivi de 40 caractères hexadécimaux.
5. Choisir Locataire, filtrer « À financer », ouvrir le bail et simuler le versement.

## Limites et suite

Les rôles ne sont pas authentifiés, les délais ne sont pas exécutés automatiquement, et les justificatifs sont fictifs. Les adresses saisies lors de la création servent à valider le formulaire, sans être stockées ni utilisées comme autorisation. Les adresses du propriétaire et du contrat ne sont pas encore modélisées. Les actions de dépassement de délai restent à intégrer avec le contrat final. Le prototype ne constitue pas une implémentation financière ni une preuve de décentralisation.

La connexion utilise wagmi et viem sur **Base Sepolia uniquement**. Les appels aux contrats seront intégrés séparément. Aucun secret n’est nécessaire au frontend : ne fournissez jamais de clé privée à l’application.

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
├── config/                  # Configuration wagmi, Base Sepolia uniquement
├── providers/               # Providers wagmi et TanStack Query
├── contexts/                # État partagé de la démonstration et hook sécurisé
├── hooks/                   # Notifications
├── services/                # Accès au stockage local des baux
├── data/                    # Jeu de données de démonstration
├── types/                   # Types partagés : bail, rôle, état et page
├── utils/                   # Formatage des dates et montants
└── styles/                  # Base, layout, composants et responsive
```

Les composants reçoivent des propriétés typées et ne lisent pas directement le stockage, hormis la commande explicite de réinitialisation qui passe par le service. `AppDemoContextProvider` centralise l’état partagé et les transitions simulées ; `leaseStorage` isole leur persistance pour préparer une future source de données. Les champs temporaires des formulaires d’actions restent dans `LeaseActions`. `useNotification` gère la durée des notifications et nettoie son minuteur au démontage.

Pour faire évoluer un écran, modifier son composant et sa feuille de style dédiée. Pour modifier une transition de démonstration, intervenir dans `contexts/AppDemoContext.tsx`. Pour changer les exemples, modifier `data/demoLeases.ts`. Les composants `Modal` et `Toast` restent indépendants du domaine locatif.

### Contexte de démonstration

`contexts/AppDemoContext.tsx` définit le contrat explicite `AppDemoContextProps`, le contexte, le hook par défaut `useAppDemoContext()` et le composant nommé `AppDemoContextProvider`. Chaque setter utilise `Dispatch<SetStateAction<T>>` : il accepte une valeur ou une fonction calculant la valeur suivante. Les pages, rôles, statuts et filtres utilisent des unions typées.

`WalletProvider` enveloppe le provider de démonstration et `App` dans `main.tsx`. Les composants connectés lisent uniquement les champs nécessaires via le hook, sans transmission de l’état partagé à travers `App`. Utiliser ce hook hors du provider déclenche une erreur explicite. Les composants génériques (`Modal`, `Toast`, `LeaseRow`) et les champs temporaires des formulaires restent indépendants du contexte.

```tsx
import useAppDemoContext, {
  AppDemoContextProvider,
} from "./contexts/AppDemoContext";
import { WalletProvider } from "./providers/WalletProvider";

function DemoRole() {
  const { role, setRole } = useAppDemoContext();
  return <button onClick={() => setRole("Locataire")}>{role}</button>;
}

<WalletProvider>
  <AppDemoContextProvider>
    <DemoRole />
  </AppDemoContextProvider>
</WalletProvider>;
```

Depuis `frontend/`, `npm test` vérifie la garde du hook et l’accès au contexte depuis les descendants du provider.

## Connexion du portefeuille

La connexion réelle utilise wagmi 3, viem et TanStack Query. `frontend/src/config/wagmi.ts` configure uniquement **Base Sepolia (84532)**, son transport HTTP public et les extensions injectées (découverte EIP-6963 incluse). Le bouton ouvre une liste des extensions disponibles. Aucun identifiant de projet ni secret n’est requis. WalletConnect et les connexions mobiles par QR code ne sont pas intégrés.

Après connexion, le menu affiche l’adresse réelle au format checksum et le réseau. Si le réseau est différent, « Passer sur Base Sepolia » demande le changement au portefeuille. Les changements de compte, de réseau et la déconnexion sont suivis par wagmi ; la reconnexion au rechargement dépend de l’autorisation conservée par l’extension. « Déconnecter » ferme la session de l’application ; l’autorisation persistante du site peut aussi être retirée dans l’extension.

Les baux, rôles affichés et soldes restent des données de démonstration locales ; ils ne sont ni authentifiés ni isolés par adresse. Connecter un portefeuille n’accorde aucun droit réel sur un contrat. Les actions simulées sont bloquées sans connexion ou hors Base Sepolia. Aucune signature, transaction, lecture de contrat ou demande de fonds n’est envoyée. Seuls la connexion et le changement de réseau sont demandés à l’extension.

### Tests du portefeuille

Depuis `frontend/` :

```sh
npm test                    # contexte et messages d’erreur
npx playwright install chromium
npm run test:e2e             # portefeuille EIP-1193 simulé, aucune clé nécessaire
```

Si Chromium est déjà installé, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` permet de l’utiliser. Les tests couvrent l’absence d’extension, la connexion, les refus, les requêtes en attente, le changement de réseau et de compte, la reconnexion et la déconnexion. Ils vérifient aussi que les actions simulées n’envoient ni transaction ni demande de signature. Une validation manuelle avec votre extension reste nécessaire pour ses propres fenêtres de confirmation.
