import { Binary, Enum } from "polkadot-api";

export type CardId = number;
export type GameId = number;
export type AccountId = Binary;

export enum CardType {
  Unit = "Unit",
  Spell = "Spell",
}

export enum EffectType {
  None = 0,
  Taunt = 1,
  Charge = 2,
  HealSelf = 3,
  DamageFront = 4,
}

export interface CardMetadata {
  id: CardId;
  name_hash: number;
  rarity: number;
  card_type: CardType;
  cost: number;
  attack: number;
  health: number;
  effects: EffectType;
}

export interface UnitInstance {
  card_id: CardId;
  current_hp: number;
  acted_this_turn: boolean;
}

export interface PlayerState {
  addr: AccountId;
  hp: number;
  energy: number;
  max_energy: number;
  deck: CardId[];
  hand: CardId[];
  board: (UnitInstance | null)[]; // length 4
}

export enum GameStatus {
  WaitingForPlayers = "WaitingForPlayers",
  InProgress = "InProgress",
  Finished = "Finished",
}

export interface Game {
  id: GameId;
  players: [PlayerState, PlayerState];
  active_idx: number;
  turn: number;
  status: GameStatus;
}

export type ActionType =
  Enum<{
    PlayCard: { hand_index: number, slot_index: number },
    UseSpell: { hand_index: number, target_slot: number },
    EndTurn: undefined,
    Concede: undefined,
  }>;

  // | { PlayCard: { hand_index: number; slot_index: number } }
  // | { UseSpell: { hand_index: number; target_slot: number } }
  // | "EndTurn"
  // | "Concede";

export enum ErrorCode {
  GameNotFound = "GameNotFound",
  NotYourTurn = "NotYourTurn",
  InvalidAction = "InvalidAction",
  NotEnoughEnergy = "NotEnoughEnergy",
  SlotOccupied = "SlotOccupied",
  InvalidSlot = "InvalidSlot",
  InvalidHandIndex = "InvalidHandIndex",
  GameAlreadyFinished = "GameAlreadyFinished",
  AlreadyInGame = "AlreadyInGame",
}

export type ContractResult<T> = { ok: T } | { err: ErrorCode };
