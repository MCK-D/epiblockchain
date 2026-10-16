# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Caution" is a rental security-deposit escrow dApp (EPITECH blockchain module, "escrow" subject). The Hardhat contract project is freshly initialized; the frontend is still a **simulated demo** (no contract, RPC or real transaction; the wallet button connects a fake account). Planned integration: wagmi + viem on **Base Sepolia only**. Stack rules: Hardhat 3 (not 2), viem (not ethers), `node:test` + `node:assert/strict` (not Mocha/Chai), Ignition for deployments. The contract must have no owner, pause, upgrade or emergency withdrawal.

All user-facing text, domain types (`Status`, `Role`, `Page` string unions), and the README are in French. Keep new UI strings in French and reuse the existing union literals exactly (they include typographic apostrophes, e.g. `"Vue d’ensemble"`).

## Layout

Two independent npm projects:
- **Root**: Hardhat 3 (template `node-test-runner-viem`) — `contracts/` (Solidity, plus Foundry-style `*.t.sol` tests), `test/` (TypeScript tests with `node:test` + viem), `ignition/modules/` (deployments; `ignition/deployments/` is committed), `scripts/`, `hardhat.config.ts`. The `Counter` files are template placeholders to replace with the lease contract.
- **`frontend/`**: the React demo described below, with its own `package.json`, `tsconfig.json` and `node_modules`. The root `tsconfig.json` excludes it.

## Commands

Node.js 22.13+.

```sh
# Contracts (repo root)
npm ci                      # .npmrc sets allow-git=root: forge-std is a GitHub dependency
npx hardhat compile
npx hardhat test            # Solidity + node:test suites
npx hardhat test nodejs test/Counter.ts   # single TypeScript test file
npx hardhat test solidity                  # Solidity tests only
npx tsc --noEmit            # type check scripts/tests/config
npx hardhat ignition deploy ignition/modules/<Module>.ts --network baseSepolia --verify

# Frontend
cd frontend
npm ci
npm run dev | build | preview | format | format:check
```

No linter. In `frontend/`, `npm run build` (`tsc -b && vite build`) is the type check. `frontend/.npmrc` points the npm cache at `/tmp/caution-npm-cache`.

Networks: `baseSepolia` (chain 84532, `chainType: "op"`) reads `BASE_SEPOLIA_RPC_URL`, `BASE_SEPOLIA_PRIVATE_KEY` and `ETHERSCAN_API_KEY` from the Hardhat keystore (`npx hardhat keystore set <NAME>`; the value is entered at the prompt, never on the command line). No `.env` files, and no mainnet network.

## Frontend architecture (`frontend/`)

Stack: React 19, TypeScript (strict), Vite 7, Tailwind CSS 4 (via `@tailwindcss/vite`), Motion, Lucide.

- **Single state hub**: `src/hooks/useDemoApp.ts` holds all app state (leases, page, role, wallet connection, balance, filters, selected lease, modal flags) and the simulated transitions. `act(status, label, credit, claimAmount)` is the one function that advances a lease's state machine: it requires the demo wallet to be connected, appends `label` to the lease's `history`, persists, and credits the balance. Change demo transitions here.
- **No router**: `App.tsx` calls `useDemoApp()` once and passes typed props down. Navigation is the `page` state; create/detail/help share a single `Modal` chosen by `create` / `help` / `selected` flags. Escape closes everything (handled in the hook).
- **Role-driven UI**: the current `Role` (Locataire / Propriétaire / Arbitre — unauthenticated) determines which actions `components/leases/LeaseActions.tsx` renders for each `Status` (Proposé → Actif → Réclamation → Litige → Clôturé, or Annulé). Temporary form fields for actions stay local to `LeaseActions`.
- **Persistence**: `src/services/leaseStorage.ts` is the only code touching `localStorage` (key `caution-leases`), falling back to `src/data/demoLeases.ts`. Components must not read storage directly (the help modal's reset goes through the service). Balance and connection are in-memory only. This service is the seam intended for a future real data source.
- `components/ui/` (`Modal`, `Toast`) are domain-agnostic; keep lease logic out of them.
- **Styles**: plain CSS split per area in `src/styles/`, aggregated by `styles/index.css` (which also imports Tailwind). When changing a screen, edit its component and its dedicated stylesheet.

## Repository sync

`.github/workflows/sync-organization.yml` mirrors all branches and tags one-way (fast-forward only, atomic) from `MCK-D/epiblockchain` to the Epitech organization repository, using the `ORG_MIRROR_TOKEN` secret. It only runs in the personal repo. Develop in the personal repo; see `docs/repository-sync.md` for setup and conflict handling.
