# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Caution" is a rental security-deposit escrow dApp (EPITECH blockchain module, "escrow" subject). The contract skeleton `contracts/RentalDeposit.sol` exists (types, immutable windows, events, custom errors, `withdraw`, shared helpers `_getLease` / `_requireStatus` / `_credit`); lease transitions still `revert NotImplemented()` and are implemented per team part (1: create/cancel/fund, 2: claims, timeouts, withdraw, 3: dispute/resolve). Time-window convention: an in-window action is allowed while `block.timestamp <= deadline`, the matching `...AfterTimeout` only when `block.timestamp > deadline`; the frontend connects real browser wallets using wagmi 3 + viem on **Base Sepolia only**. Contract data/actions are not wired: show unavailable states, never seed data, fake balances or simulated transitions. Stack rules: Hardhat 3 (not 2), viem (not ethers), `node:test` + `node:assert/strict` (not Mocha/Chai), Ignition for deployments. The contract must have no owner, pause, upgrade or emergency withdrawal.

All user-facing text, domain types (`Status`, `Role`, `Page` string unions), and the README are in French. Keep new UI strings in French and reuse the existing union literals exactly (they include typographic apostrophes, e.g. `"Vue d’ensemble"`).

## Layout

Two independent npm projects:
- **Root**: Hardhat 3 (template `node-test-runner-viem`) — `contracts/` (Solidity, plus Foundry-style `*.t.sol` tests), `test/` (TypeScript tests with `node:test` + viem), `ignition/modules/` (deployments; `ignition/deployments/` is committed), `scripts/`, `hardhat.config.ts`.
- **`frontend/`**: the React frontend described below, with its own `package.json`, `tsconfig.json` and `node_modules`. The root `tsconfig.json` excludes it.

## Commands

Node.js 22.13+.

```sh
# Contracts (repo root)
npm ci                      # .npmrc sets allow-git=root: forge-std is a GitHub dependency
npx hardhat compile
npx hardhat test            # Solidity + node:test suites
npx hardhat test nodejs test/RentalDeposit.ts   # single TypeScript test file
npx hardhat test solidity                  # Solidity tests only
npx tsc --noEmit            # type check scripts/tests/config
npx hardhat ignition deploy ignition/modules/RentalDeposit.ts --network baseSepolia --parameters ignition/parameters/demo.json --verify   # demo delays (120 s); defaults are production delays

# Frontend
cd frontend
npm ci
npm run dev | build | preview | format | format:check | test
```

No linter. In `frontend/`, `npm run build` (`tsc -b && vite build`) is the type check. `frontend/.npmrc` points the npm cache at `/tmp/caution-npm-cache`.

Networks: `baseSepolia` (chain 84532, `chainType: "op"`) reads `BASE_SEPOLIA_RPC_URL`, `BASE_SEPOLIA_PRIVATE_KEY` and `ETHERSCAN_API_KEY` from the Hardhat keystore (`npx hardhat keystore set <NAME>`; the value is entered at the prompt, never on the command line). No `.env` files, and no mainnet network.

## Frontend architecture (`frontend/`)

Stack: React 19, TypeScript (strict), Vite 7, Tailwind CSS 4 (via `@tailwindcss/vite`), Motion, Lucide.

- **UI context**: `src/contexts/AppContext.tsx` holds page, mobile menu and help state. Use the default `useAppContext()` hook, which throws outside `AppContextProvider`. Setters are explicitly typed with `Dispatch<SetStateAction<T>>`.
- **Providers**: `main.tsx` wraps `App` in `WalletProvider` then `AppContextProvider`. Wagmi owns real wallet state; do not add a writable fake connection flag.
- **No router**: navigation uses the typed `Page` state. Escape closes help and the menu.
- **Contract data**: no application fixtures, lease localStorage, simulated roles, balances, histories or transitions. No contract reads/writes exist yet. Render unavailable states, not zero or an assertion of no leases. Lease creation stays disabled until integration.
- **Wallet**: `config/wagmi.ts` configures Base Sepolia only, injected wallets and EIP-6963. `components/wallet/WalletControls.tsx` handles real account/network state and readable errors. No private keys, signing or transaction requests.
- **Styles**: CSS in `src/styles/` is grouped by responsibility and imported by `styles/index.css`.
- **Tests**: `npm test` checks context and errors. `npm run test:e2e` exercises wallet connections and unavailable contract screens. Mock EIP-1193 providers and legacy storage fixtures belong only in tests.

## Repository sync

`.github/workflows/sync-organization.yml` mirrors all branches and tags one-way (fast-forward only, atomic) from `MCK-D/epiblockchain` to the Epitech organization repository, using the `ORG_MIRROR_TOKEN` secret. It only runs in the personal repo. Develop in the personal repo; see `docs/repository-sync.md` for setup and conflict handling.
