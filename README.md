# Cards on-chain

A competitive collectible card game ala Hearthstone or Inscryption but on-chain, built with smart contracts on the Polkadot Hub.
This repo is a collection of an ink! smart contract and a NextJs frontend to play the game.

## Features

The main features are:
- Turn-based gameplay
- Drawing cards with on-chain randomness
- Private hands
- (future) Booster packs purchasable with DOT
- (future) Governance to buff/nerf certain cards

## Randomness

For randomly drawing cards, we use BABE randomness from the Polkadot Relay Chain.
This is accessed via a randomness precompile on the Hub.

At the start of each match, each player generates a secret key.
This key, along with the randomness, is used with a VRF to get a verifiable random number
and use it for drawing cards.
These cards can later be played and the VRF signature revealed, which the contract can verify
to know everything was according to protocol.

## Deployment

For now, the contract aims to be deployed on passet-hub, a temporary chain with `pallet-revive` smart contracts
on the Paseo testnet.
In the future, once the Polkadot Hub launches, it'll be deployed there.
