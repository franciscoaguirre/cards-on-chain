import { Game, PlayerState, UnitInstance } from "./contract/types";
import { CARDS, CARD_LIST } from "./cards";

// Get card attack from frontend card configuration
const getCardAttack = (cardId: number): number => {
  const card = CARD_LIST.find(c => c.id === cardId);
  return card?.attack ?? 1; // Default to 1 if card not found
};

interface DamageToUnit {
  playerIdx: number;
  slot: number;
  damage: number;
}

interface DamageToPlayer {
  playerIdx: number;
  damage: number;
}

/**
 * Simulates the auto-resolution combat phase that happens when a turn ends
 * This mirrors the contract logic in contracts/game/lib.rs lines 316-421
 */
export function simulateAutoResolution(game: Game): Game {
  // Create a deep copy to avoid mutations
  const gameCopy = JSON.parse(JSON.stringify(game)) as Game;
  
  const activeIdx = gameCopy.active_idx;
  const opponentIdx = 1 - activeIdx;

  // Combat phase: units attack forward (lines 320-350)
  const damageToUnits: DamageToUnit[] = [];
  const damageToPlayers: DamageToPlayer[] = [];

  for (let slot = 0; slot < 4; slot++) {
    const attacker = gameCopy.players[activeIdx].board[slot];
    if (attacker) {
      const attackPower = getCardAttack(attacker.card_id);
      const defender = gameCopy.players[opponentIdx].board[slot];

      if (defender) {
        // Unit vs unit combat
        const defenderAttack = getCardAttack(defender.card_id);
        
        // Both units deal damage to each other
        damageToUnits.push({
          playerIdx: activeIdx,
          slot: slot,
          damage: defenderAttack
        });
        damageToUnits.push({
          playerIdx: opponentIdx,
          slot: slot,
          damage: attackPower
        });
      } else {
        // Attack player directly
        damageToPlayers.push({
          playerIdx: opponentIdx,
          damage: attackPower
        });
      }
    }
  }

  // Apply damage to units (lines 352-357)
  for (const { playerIdx, slot, damage } of damageToUnits) {
    const unit = gameCopy.players[playerIdx].board[slot];
    if (unit) {
      unit.current_hp -= damage;
    }
  }

  // Apply damage to players (lines 359-362)
  for (const { playerIdx, damage } of damageToPlayers) {
    gameCopy.players[playerIdx].hp -= damage;
  }

  // Remove dead units (lines 364-373)
  for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
    for (let slot = 0; slot < 4; slot++) {
      const unit = gameCopy.players[playerIdx].board[slot];
      if (unit && unit.current_hp <= 0) {
        gameCopy.players[playerIdx].board[slot] = null;
      }
    }
  }

  return gameCopy;
}

/**
 * Determines if the game would end after auto-resolution
 * Returns the winner's player index, or null if game continues
 */
export function checkGameEndAfterResolution(game: Game): number | null {
  if (game.players[0].hp <= 0) {
    return 1; // Player 1 wins
  } else if (game.players[1].hp <= 0) {
    return 0; // Player 0 wins
  }
  return null; // Game continues
}

/**
 * Gets units that would die in combat resolution
 * Returns array of {playerIdx, slot} for units that would be destroyed
 */
export function getUnitsToBeDestroyed(game: Game): Array<{playerIdx: number, slot: number}> {
  const simulatedGame = simulateAutoResolution(game);
  const destroyedUnits: Array<{playerIdx: number, slot: number}> = [];

  for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
    for (let slot = 0; slot < 4; slot++) {
      const originalUnit = game.players[playerIdx].board[slot];
      const simulatedUnit = simulatedGame.players[playerIdx].board[slot];
      
      // Unit existed before but is null after = destroyed
      if (originalUnit && !simulatedUnit) {
        destroyedUnits.push({ playerIdx, slot });
      }
    }
  }

  return destroyedUnits;
}

/**
 * Gets damage that would be dealt to players
 * Returns array of {playerIdx, damage} for player damage
 */
export function getPlayerDamage(game: Game): Array<{playerIdx: number, damage: number}> {
  const originalGame = JSON.parse(JSON.stringify(game)) as Game;
  const simulatedGame = simulateAutoResolution(game);
  const playerDamage: Array<{playerIdx: number, damage: number}> = [];

  for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
    const damage = originalGame.players[playerIdx].hp - simulatedGame.players[playerIdx].hp;
    if (damage > 0) {
      playerDamage.push({ playerIdx, damage });
    }
  }

  return playerDamage;
}