# Caution — frontend de démonstration

Prototype français d’une application de dépôt de garantie locative. **Frontend uniquement** : les baux, portefeuilles, soldes et actions sont fictifs. Aucun contrat, RPC, backend, secret ou transaction blockchain.

## Démarrer

Node.js 22.12+ ou 24 recommandé.

```sh
npm ci
npm run dev
```

```sh
npm run build   # TypeScript puis build Vite dans dist/
npm run preview
```

Stack : React 19, TypeScript, Vite 7, Tailwind CSS 4, Motion et Lucide. `src/main.tsx` monte l’application ; `src/App.tsx` assemble les composants. Les styles importent Tailwind via son plugin Vite.

## Parcours

- Tableau de bord : montants, baux et réclamation à examiner.
- Baux : recherche, filtres par état, détail et historique.
- Création : libellé privé, caution, date de fin, adresses fictives du locataire et de l’arbitre.
- Choix du rôle pour explorer le financement, la restitution, les réclamations et la résolution des litiges.
- Le bouton de portefeuille connecte un **compte de démonstration**, sans extension.
- Les baux sont enregistrés dans le `localStorage` de ce navigateur. Le solde et la connexion sont conservés uniquement pendant la session de la page. « Comprendre Caution » permet de réinitialiser le scénario.

## Scénario de découverte

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
src/
├── main.tsx                 # Point d’entrée React
├── App.tsx                  # Assemblage de l’interface et des modales
├── components/
│   ├── layout/              # Navigation, en-tête, rôle, pied de page
│   ├── dashboard/           # Indicateurs et alerte de réclamation
│   ├── leases/              # Liste, ligne, création, détail et actions
│   ├── help/                # Explication du fonctionnement
│   └── ui/                  # Modale et notification réutilisables
├── contexts/                # État partagé, provider et hook sécurisé
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

Le provider enveloppe `App` dans `main.tsx`. Les composants connectés lisent uniquement les champs nécessaires via le hook, sans transmission de l’état partagé à travers `App`. Utiliser ce hook hors du provider déclenche une erreur explicite. Les composants génériques (`Modal`, `Toast`, `LeaseRow`) et les champs temporaires des formulaires restent indépendants du contexte.

```tsx
import useAppDemoContext, {
  AppDemoContextProvider,
} from "./contexts/AppDemoContext";

function DemoWallet() {
  const { connected, setConnected } = useAppDemoContext();
  return (
    <button onClick={() => setConnected((previous) => !previous)}>
      {connected ? "Déconnecter" : "Connecter"}
    </button>
  );
}

<AppDemoContextProvider>
  <DemoWallet />
</AppDemoContextProvider>;
```

`npm test` vérifie la garde du hook et l’accès au contexte depuis les descendants du provider.
