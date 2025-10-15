# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cards on-chain is a competitive collectible card game built with smart contracts on the Polkadot Hub. The project consists of:

- **Contracts**: Multi-contract workspace with game logic, card NFTs, and shared types
- **Frontend**: Next.js application with Polkadot API integration and full UI components
- **Scripts**: Deployment and interaction utilities using Bun/TypeScript

## Key Technologies

- **Smart Contract**: ink! v6.0.0-alpha.4 on Rust edition 2024
- **Deployment Target**: passet-hub (temporary chain with pallet-revive), future Polkadot Hub
- **Randomness**: BABE randomness from Polkadot Relay Chain via randomness precompile
- **Game Mechanics**: VRF-based card drawing with verifiable randomness

## Build Commands

### Smart Contracts
Use Pop CLI for all smart contract operations from the `contracts/` directory:

```bash
cd contracts
pop build                     # Build all workspace contracts
pop test contract            # Run unit tests
pop test --e2e              # Run E2E tests (launches local environment automatically)

# Individual contract builds
cd contracts/game && pop build    # Game logic contract
cd contracts/cards && pop build   # ERC-721 card NFT contract
```

### Frontend
```bash
cd frontend
pnpm install                  # Install dependencies
pnpm dev                      # Start development server
pnpm build                    # Build for production
pnpm lint                     # Run linting
pnpm start                    # Start production server
```

### Scripts
```bash
cd scripts
bun install                   # Install dependencies
bun run index.ts             # Run deployment/interaction scripts
```

### Contract Deployment
```bash
# Deploy to local node
pop up -p . --constructor new --args "false" --suri //Alice

# Deploy with wallet signing (more secure)
pop up -p . --constructor new --args "false" --use-wallet

# Deploy to passet-hub testnet
pop up contract --constructor new --args "false" --suri 0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a --url wss://testnet-passet-hub.polkadot.io
```

### Contract Interaction
```bash
# Read-only calls
pop call contract -p . --contract $CONTRACT_ADDRESS --message get --suri //Alice

# State-changing calls (use -x flag)
pop call contract -p . --contract $CONTRACT_ADDRESS --message flip --suri //Alice -x
```

## Architecture Notes

### Smart Contract Structure
- **Workspace Architecture**: Cargo workspace with three contracts in `contracts/`
  - `contracts/game/`: Main game logic contract (`CardsOnChain`) with matchmaking, game state, and turn management
  - `contracts/cards/`: ERC-721 card NFT contract for collectible cards
  - `contracts/shared/`: Shared types and utilities used across contracts
- **Game Contract**: Implements player matching, turn-based gameplay, card drawing with VRF verification
- **Card Contract**: Standard ERC-721 implementation for minting/transferring card NFTs

### Frontend Architecture
- **Next.js 15** with React 19 and TypeScript
- **Polkadot Integration**: Uses `@reactive-dot/react` and `polkadot-api` for chain interaction
- **UI Components**: Comprehensive component library with Radix UI and custom game components
- **State Management**: React hooks for game state (`use-game-state.tsx`) and contract interaction
- **Contract Interface**: Typed contract definitions in `lib/contract/` with helper functions

### Game Design Concepts
- Turn-based gameplay with on-chain randomness
- Private hands using secret keys + VRF
- Card drawing verified through VRF signatures
- Future features: booster packs with DOT, governance for card balancing

### Deployment Context
- Target: Polkadot Hub ecosystem
- Uses pallet-revive for smart contract execution
- Leverages Polkadot's native randomness infrastructure

## Development Notes

### Contract Development
- Uses ink! v6.0.0-alpha.4 with unstable host functions (`unstable-hostfn` feature)
- Pop CLI automatically handles local test environment setup for E2E tests
- Workspace dependencies are centralized in root `Cargo.toml`
- Pop CLI supports both WASM (default) and experimental PolkaVM compilation

### Frontend Development
- Uses PNPM package manager (v9.15.5)
- Polkadot API descriptors auto-generated via `papi` postinstall hook
- Contract address configurable via `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable
- Game assets stored in `public/cards/` as SVG files

### Integration Points
- Frontend connects to contracts via typed interfaces in `lib/contract/`
- Contract events mapped to frontend state updates
- VRF signature verification happens both client-side and on-chain