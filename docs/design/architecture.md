# Architecture

Vue d’ensemble de Caution : qui parle à qui, où sont les fonds, où sont les documents.

```mermaid
flowchart LR
    users["Propriétaire · Locataire · Arbitre<br/>3 adresses fixées dans le bail"]

    subgraph navigateur["Navigateur"]
        front["Frontend React<br/>wagmi 3 + viem"]
        wallet["Portefeuille (extension)<br/>EIP-6963 · détient la clé, signe"]
        files["Fichiers du bail et justificatifs<br/>restent sur l’appareil"]
    end

    rpc["RPC Base Sepolia<br/>chain 84532"]

    subgraph chaine["Base Sepolia"]
        contract["RentalDeposit<br/>0x4b7F…504C<br/>baux · balances · 3 délais immuables<br/>pas d’owner, de pause ni d’upgrade"]
    end

    deploy["Hardhat 3 · Ignition<br/>déploie et vérifie sur Basescan"]

    users --> front
    files -- "keccak256 → leaseHash, claimHash" --> front
    front -- "lectures : leaseCount, getLease (multicall)" --> rpc
    front -- "transaction simulée, à signer" --> wallet
    wallet -- "transaction signée" --> rpc
    rpc --> contract
    contract -. "événements (LeaseCreated → id du bail)" .-> front
    deploy --> contract
```

## Points clés

- **Le frontend ne détient ni clé ni fonds.** Il lit la chaîne, simule chaque transaction pour décoder un éventuel refus du contrat, puis la confie au portefeuille qui signe.
- **La caution est en ETH natif dans le contrat.** Elle ne sort que par `withdraw`, après qu’une transition a crédité le solde du bénéficiaire.
- **Personne ne contrôle le contrat après le déploiement.** Le déployeur fixe seulement les trois délais (`claimWindow`, `responseWindow`, `arbitrationWindow`), 120 s chacun avec `ignition/parameters/demo.json`.
- **Les documents restent hors chaîne.** Seule leur empreinte keccak256 est enregistrée dans le bail.
- **L’identifiant d’un nouveau bail vient de l’événement `LeaseCreated`**, pas de `leaseCount`, car un autre bail peut être créé entre-temps.
