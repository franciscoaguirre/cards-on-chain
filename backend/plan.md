# PROJECT PLAN — On‑Chain Collectible Card Game (Polkadot + Next.js)

> **Goal:** Build a collectible card game with _all game state tracked on‑chain_ using ink! smart contracts deployed on Polkadot, and a Next.js frontend acting as a rich UI that mirrors on‑chain rules. Game rules: each player has a row of 4 slots, units or spells, energy system (starts small, +1 max energy per round, refresh each round), automatic forward attacks each turn, attacks resolve when the turn ends. Players start with 20 health. The project is developed across incremental, hackathon‑friendly versions (V1–V5).

---

## Table of contents
1. Overview & constraints (all state on‑chain)
2. High level architecture (on‑chain focused)
3. On‑chain data models (single authoritative Game state)
4. Smart contract design (ink!) — game logic executed on‑chain
5. Frontend (Next.js) design — mirror & optimistic UI
6. Game mechanics & action batching model
7. Wallet & transaction UX
8. Randomness plan for V1–V2 (block hash modulo)
9. Booster packs & payments (V4)
10. Effects & spells (V2)
11. Matchmaking (single Game queue -> autostart)
12. Milestones & deliverables (V1–V5) — updated
13. Testing, QA, security considerations (reorgs, gas, invalid actions)
14. CI / deployment / observability
15. Appendix: compact on‑chain schemas & events

---

# 1 — Overview & constraints (important changes)
- **All authoritative game state lives in the `game_contract` on‑chain.** There is no off‑chain authoritative resolution. The frontend must mirror the contract logic exactly and shows the same animations while a transaction confirming the actions is included.
- **Action batching:** at the end of each turn the frontend assembles a *batch* of actions performed during the turn (plays, passes, targets for spells/effects, etc.) and sends them to the contract in a single transaction. The contract executes actions in order; if any action is invalid the contract **reverts** and the transaction fails — preventing cheating.
- **Public hand (V1 & V2):** to simplify cryptography / VRF requirements for early versions, each player's hand is public in contract storage. Draw logic for these early versions uses the block hash modulo deck size (deterministic, insecure — acceptable for hackathon MVP).
- **No match transcripts stored off‑chain:** transcripts aren't necessary; the contract emits events for each action and state transition, and an indexer can reconstruct entire matches from events.
- **Deterministic UI mirror:** the frontend implements the exact same action execution algorithm so the player sees actions animated in the same order and with the same deterministic outcomes while waiting for on‑chain inclusion.

Constraints & hackathon tradeoffs:
- On‑chain full state increases gas costs per turn and per action; we will design compact encodings and batch operations to reduce extrinsic weight.
- Keep card metadata compact on contract and store rich imagery/long text off‑chain (URI). Only gameplay‑relevant fields exist on chain.

---

# 2 — High level architecture (on‑chain authoritative)
Components:
- **`card_nft` contract (PSP34)** — mints/owns collectible cards; stores base gameplay stats and a compact `effects` enum. Cards are immutable once minted (base stats) but the contract supports separate stat adjustments through `governance` (V5) as additive modifiers.
- **`game_contract` (single, authoritative ink! contract)** — stores full `Game` struct(s) including hands, decks, boards, energies, HP. Exposes:
  - matchmaking APIs (register wanting to play),
  - action submission API (submit batch for current turn),
  - `end_turn_execute(actions[])` entrypoint which applies and validates actions in order, updates state, emits events,
  - draw mechanic (uses recent block hash for V1/V2),
  - booster purchase hooks (calls into card contract or coordinates minting),
  - governance hooks for stat adjustments.
- **Next.js frontend** — mirrors game rules locally and calls contracts; displays pending tx animations and falls back to chain state on confirmations.
- **Indexer (optional)** — listens to contract events to reconstruct matches for replay and leaderboards. This is optional and not required for gameplay.

Diagram (conceptual):
```
Polkadot Wallet <-> Next.js UI (mirror) <-> Ink! Contracts (card_nft + game_contract)
                                                  emits events -> Indexer (replay / history)
```

---

# 3 — On‑chain data models (compact & authoritative)
All gameplay state lives in the `game_contract`.

**CardMetadata (on card_nft)**
```rust
pub struct CardMetadata {
  id: CardId,
  name_hash: u32,         // short hash to keep storage small
  rarity: u8,             // 0..255
  card_type: u8,          // 0 = Unit, 1 = Spell
  cost: u8,
  attack: u8,             // 0 for spells or non‑attacking units
  health: u8,             // 0 for spells
  effects: u32,           // bitflags or enum id referencing effect list
  uri: Option<String>,    // optional offchain URI
}
```

**Action (compact)** — serialized into a compact byte format to minimize weight:
```text
enum ActionType { PlayCard(slot_idx, card_id), UseSpell(hand_idx, target_pos), EndTurn, Concede }
// plus fields for targeting: row, col, target_player
```

**Game (authoritative struct)**
```rust
pub struct PlayerState {
  addr: AccountId,
  hp: i16,                 // start 20
  energy: u8,
  max_energy: u8,
  deck: Vec<CardId>,       // remaining deck
  hand: Vec<CardId>,       // public for V1/V2
  board: [Option<UnitInstance>;4],
}

pub struct UnitInstance {
  card_id: CardId,
  current_hp: i16,
  // any ephemeral flags
  acted_this_turn: bool,
}

pub struct Game {
  id: GameId,
  players: [PlayerState;2],
  active_idx: u8,          // 0 or 1
  turn: u32,
  status: u8,              // enum
  // compact logs not stored; events emitted instead
}
```

Notes:
- Cards in hand are stored as `CardId` arrays on chain (public for V1/V2). Clients fetch metadata from `card_nft` as needed.
- `UnitInstance` stores dynamic current HP.

---

# 4 — Smart contract design (ink!) — game logic executed on‑chain
**Single authoritative `game_contract` responsibilities:**
- Manage matchmaking and create `Game` structs when two players are matched.
- Manage draw, play, and execution of batched actions per turn.
- Validate every action in the batch; revert on any invalid action.
- Update `Game` state deterministically and emit granular events for each action (e.g., `CardPlayed`, `AttackResolved`, `UnitDied`, `PlayerDamaged`).
- Enforce limits (hand size, board size 4, energy checks) in contract checks.

**Key entrypoints:**
- `register_for_match()` — adds caller to queue; if second player exists, create Game and initialize (shuffle deck/seeding via block hash).
- `submit_turn_actions(game_id, actions: Vec<u8>)` — owner (active player) submits serialized actions for current turn. Contract validates and executes.
- `get_game_state(game_id)` — view function returning compressed game state.
- `buy_booster()` — payable: mints/cards to buyer (V4 flow, can be coordinated with card contract).
- `apply_governance_adjustment(card_id, adjustments)` — gated by governance (V5).

**Execution model:**
- `submit_turn_actions` will:
  1. Check caller is active player.
  2. Deserialize actions and iterate in order.
  3. For each action: validate preconditions (e.g., playing a card: slot empty, card exists in player's hand, enough energy), then apply state changes.
  4. At the `EndTurn` action, perform the automatic attack resolution for the active player's units (use exact deterministic rules), update HP, remove died units.
  5. Increment turn, switch `active_idx`, refresh energy for the new active player, draw a card for the newly active player (using block hash modulo deck for V1/V2), but **note** drawing at start of turn must use a recent block hash that is predictable to both players and not manipulable by the currently executing transaction. We will discuss anti‑front‑running below.
  6. Emit events for every state transition.
- If any action fails validation, `submit_turn_actions` **reverts** (contract state unchanged) — this prevents cheating.

Gas & performance considerations:
- Batch actions to reduce extrinsic overhead; but guard against oversized action arrays (limit payload size per call).
- Use compact encodings (u8/u16) instead of verbose structs when possible.

---

# 5 — Frontend (Next.js) design — mirror & optimistic UI
The frontend must implement the exact same validation/execution algorithm as the contract so it can:
- display live animations replicating the on‑chain resolution while waiting for tx inclusion,
- detect invalid local batches before submission to avoid failed transactions,
- present a deterministic replay of the actions once confirmed.

UX flow:
- Player performs actions locally; actions appended to `pendingActions` list.
- On `End Turn`, frontend simulates executing `pendingActions` against a local copy of the `Game` state (using the same code used by the contract) and shows final board/animations.
- Submit `submit_turn_actions` transaction with serialized actions.
- While transaction pending, show the same animations in optimistic mode. If tx fails, revert UI to the on‑chain state (fetch `get_game_state`). If tx succeeds, update to on‑chain state.

Implementation note: **share code** between frontend and contract logic where possible (e.g., port the resolution algorithm in Rust → compile to WASM or re‑implement in TypeScript with strict parity tests). Provide a test suite to ensure both implementations produce identical outcomes.

---

# 6 — Game mechanics & action batching model (detailed)
Actions supported in V1/V2 (compact form):
- `PlayCard { hand_index: u8, slot_index: u8 }` — place unit from hand into player's slot
- `UseSpell { hand_index: u8, target: Target }` — cast spell from hand on specified target
- `EndTurn` — indicates player finished performing actions and wants resolution to run
- `Concede` — resign match

Resolution rules (applies at EndTurn):
- For each slot index i=0..3 in left→right order:
  - If attacker unit exists in active player's slot i:
    - If defender exists at opponent slot i: both exchange damage simultaneously (attacker.current_hp -= defender.attack; defender.current_hp -= attacker.attack).
    - Else: defender player.hp -= attacker.attack.
- After processing all slots, remove any units with current_hp <= 0.
- After resolution, increase turn counter, switch active player index, update energies (new active player's `max_energy = min(max_cap, max_energy + 1)`, `energy = max_energy`), draw 1 card for newly active player using block hash modulo deck size.

Validation examples the contract enforces:
- PlayCard: hand_index must be in range, card present, slot free, card is a Unit type, player has enough energy.
- UseSpell: hand_index valid, target valid for spell effect, enough energy.
- Cannot submit EndTurn if there are unsubmitted actions? (EndTurn is just a special action; contract accepts empty or non‑empty batches.)

Event emission: emit concise events per action for indexers to reconstruct matches: `ActionSubmitted`, `CardPlayed`, `SpellUsed`, `AttackResolution`, `UnitDied`, `PlayerDamaged`, `TurnEnded`, `GameStarted`, `GameEnded`.

---

# 7 — Wallet & transaction UX
- Use Polkadot.js extension to sign transactions calling `submit_turn_actions`.
- Because actions are executed on‑chain and can fail, frontend must run local validation first and warn users about likely reverts. But reverts are possible if chain conditions differ (e.g., block hash used for draw differs) — mitigate by reading chain state before submission and including a deterministic draw seed if needed.
- Show explicit gas/weight estimation UI where supported by RPC.

---

# 8 — Randomness plan for V1–V2 (block hash modulo)
- **V1 & V2:** use the most recent finalized block hash (or a block available at transaction inclusion time) deterministically: `index = block_hash % deck_len` to select which `CardId` to draw from deck. This is insecure (miners/validators could influence), but acceptable for hackathon prototypes.
- Because draws occur inside `submit_turn_actions`, relying on the block hash inside the same transaction may be subject to miner influence. To reduce manipulation:
  - **Option A (simple):** draw uses the block hash of the previous finalized block (RPC exposes it) that both parties can read prior to submission. Use that hash as a seed in the draw step. Document the limitation.
  - **Option B (slightly stronger):** require players to include a small commitment (their random nonce) at game start and combine it with block hash for draws. This is more complex; keep as future improvement.

Migration to secure VRF planned for V3.

---

# 9 — Booster packs & payments (V4)
- `buy_booster` call on `game_contract` or `booster_shop` contract receives payment and mints 5 cards to buyer (transfers via `card_nft` contract). For deterministic reveal, the contract uses block hash modulo rarity tables to pick card IDs.
- Events emitted: `BoosterBought(buyer, amount, card_ids)`.

---

# 10 — Effects & spells (V2)
- **Effects field:** cards have an `effects` value (enum / bitflag) stored on `card_nft`. V2 expands gameplay: units may have passive/active effects and spells are full effects.
- **Example effects enum (compact):**
  - `NoEffect = 0`
  - `Taunt = 1` (not used in V1 but reserved)
  - `Charge = 2` (can attack immediately when played — careful with timing rules)
  - `HealSelf = 3` (on play heal X)
  - `DamageFront = 4` (on play or end turn, damage front target)
  - `Deathrattle_X = 100 + x` (on death trigger)

- Effects must be implemented both in contract and in frontend mirror. The contract will check effects and resolve them during action execution and during EndTurn resolution. Keep effects limited and enumerated for compactness.

---

# 11 — Matchmaking (single Game struct queue)
- **Simplified matchmaking for hackathon:** `game_contract` holds a single waiting slot.
  - `register_for_match()` — caller sets themselves as waiting_player if none exists; if someone is waiting, the contract creates a new `Game` with the two players and initializes decks/hands/starting energy and emits `GameStarted`.
  - This approach supports multiple concurrent games only by extending the queue to a list; for hackathon single active matchmaking slot is acceptable and reduces complexity.
- Initialization details: both players' decks are derived from their owned cards or a default demo deck (configurable). For V1/V2 keep starting hands public on chain.

---

# 12 — Milestones & deliverables (updated)
**Version 1 — On‑chain authoritative MVP (hackathon target)**
- All gameplay state on‑chain in `game_contract`.
- Public hands and block‑hash modulo draws.
- Single matchmaking queue and automatic game start.
- Action batching via `submit_turn_actions` with full validation & revert on invalid action.
- Frontend implements exact mirror logic and optimistic animations while waiting for tx inclusion.
- Deliverables:
  - `card_nft` PSP34 contract with base metadata + effects field.
  - `game_contract` with Game struct, matchmaking, submit/execution API, events.
  - Next.js frontend with play UI, local validation, and transaction submission.

**Version 2 — Effects & Spells on‑chain**
- Extend card metadata to support spells and unit effects (effects enum). Both unit effects and spells executed fully on‑chain.
- Keep hands public and drawing still using block hash modulo.
- Deliverables: spell implementations, additional unit effect enums, expanded frontend UI for targeting and spell animation.

**Version 3 — On‑chain randomness & robustness**
- Replace block hash draw with secure randomness (VRF or on‑chain randomness pallet) for draws and booster reveal.
- Consider improvements to reduce miner influence on draws (commitments). Optionally add per‑game nonce/seeding.

**Version 4 — Booster packs (paid)**
- Implement booster purchase flows, mint 5 cards per purchase, handle payments in DOT.

**Version 5 — Governance for stat adjustments**
- Allow governance contract to submit stat adjustments (only additive adjustments allowed) that clients combine with base stats at runtime.

---

# 13 — Testing, QA, security considerations
Major risks and mitigations:
- **Gas & weight:** full on‑chain state updates per turn may be heavy. Mitigate by compact action encodings, limits on action batch size, and efficient data structures.
- **Invalid action reverts:** reverts are desired. But frequent reverts are poor UX — frontend must validate locally before submission.
- **Block hash manipulation:** drawing within the same transaction could be manipulated. Use the previous finalized block hash for draws or migrate to VRF in V3.
- **Chain reorgs:** if frontend uses a block hash for deterministic UI that later reorgs, the contract will use the canonical chain — frontend must fetch canonical chain state on tx failure.
- **Denial of service:** guard against huge arrays by enforcing maximum action payload size.
- **Front‑running:** because actions are sent on‑chain, an adversary may see pending transactions — ensure critical secrets are not exposed (hands are public in V1/V2 by design).

Testing checklist:
- Parity tests to ensure Rust contract logic and TypeScript frontend logic produce identical outcomes for a wide sample of action sequences.
- Integration tests running a sequence of `submit_turn_actions` on a local test node and asserting expected on‑chain Game state.
- Gas profiling to keep actions within practical bounds.

---

# 14 — CI / deployment / observability
- GitHub Actions for building ink! contracts and running unit tests.
- Deployment scripts for contracts to local node and testnet.
- Events emitted for every action to let an indexer reconstruct match history.

---

# 15 — Appendix: compact on‑chain schemas & events
**Events** (representative):
- `GameQueued(player)`
- `GameStarted(game_id, player_a, player_b)`
- `ActionApplied(game_id, player, action_type, payload)`
- `CardPlayed(game_id, player, card_id, slot)`
- `SpellUsed(game_id, player, card_id, target)`
- `AttackResolved(game_id, attacker_slot, defender_slot, damage_attacker, damage_defender)`
- `UnitDied(game_id, player, slot, card_id)`
- `PlayerDamaged(game_id, player, amount)`
- `TurnEnded(game_id, new_active_player)`
- `GameEnded(game_id, winner)`

**Compact Action serialization suggestion**
- Use a small binary format: [u8 action_type][u8 paramA][u8 paramB][u32 extra]
- Keep payload under a configurable size limit (e.g., 1024 bytes) per submission.

---

# Next steps I can implement for you (pick one):
- Produce the updated ink! contract stubs for `card_nft` and `game_contract` with the authoritative on‑chain Game struct and `submit_turn_actions` skeleton.
- Produce TypeScript pseudo‑implementation of the resolution engine (exact parity with the contract) for the frontend.
- Create a compact action binary encoding spec + serializer/deserializer examples for TS and Rust.

Choose one and I will add it into the project workspace.

