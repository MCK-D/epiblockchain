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

Stack : React 19, TypeScript, Vite 7, Tailwind CSS 4, Motion et Lucide. `src/main.tsx` contient les écrans et transitions simulées ; `src/style.css` contient le thème responsive et importe Tailwind via son plugin Vite.

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
