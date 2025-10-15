# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cards on-chain is a competitive collectible card game built with smart contracts on the Polkadot Hub. The project consists of:

- **Backend**: ink! smart contract written in Rust (currently a basic template)
- **Frontend**: NextJS frontend (directory exists but empty)

## Key Technologies

- **Smart Contract**: ink! v6.0.0-alpha.4 on Rust edition 2024
- **Deployment Target**: passet-hub (temporary chain with pallet-revive), future Polkadot Hub
- **Randomness**: BABE randomness from Polkadot Relay Chain via randomness precompile
- **Game Mechanics**: VRF-based card drawing with verifiable randomness

## Build Commands

### Smart Contract (Backend)
Use Pop CLI for all smart contract operations:

```bash
cd backend
pop build                     # Build contract (generates target/ink/ artifacts)
pop test contract            # Run unit tests
pop test --e2e              # Run E2E tests (launches local environment automatically)
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
- Main contract: `backend/lib.rs` contains the `CardsOnChain` contract module
- Currently implements basic storage template (single boolean value)
- Includes unit tests and E2E test framework setup

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

- The contract uses ink! unstable host functions (`unstable-hostfn` feature)
- Pop CLI automatically handles local test environment setup for E2E tests
- Frontend integration is planned but not yet implemented
- The current contract is a template and needs implementation of game logic
- Pop CLI supports both WASM (default) and experimental PolkaVM compilation