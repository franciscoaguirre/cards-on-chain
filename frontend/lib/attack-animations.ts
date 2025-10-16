import { Game } from "./contract/types";
import { CARD_LIST } from "./cards";

export interface AttackAnimation {
  id: string;
  type: 'unit-attack' | 'unit-damage' | 'player-damage' | 'unit-death';
  sourceSlot?: number;
  targetSlot?: number;
  targetPlayer?: number;
  damage?: number;
  unitName?: string;
  delay: number; // ms from start of animation sequence
  duration: number; // ms
}

export interface CombatSequence {
  animations: AttackAnimation[];
  totalDuration: number;
}

/**
 * Creates a sequence of animations for the combat phase
 * Based on the combat logic in auto-resolution.ts
 */
export function createCombatAnimations(game: Game): CombatSequence {
  const animations: AttackAnimation[] = [];
  const activeIdx = game.active_idx;
  const opponentIdx = 1 - activeIdx;
  let currentDelay = 0;
  
  const ATTACK_DURATION = 800;
  const DAMAGE_DURATION = 1200; // Longer to see damage numbers
  const DEATH_DURATION = 800;
  const SEQUENCE_GAP = 300; // Longer gaps for better visual clarity

  // Phase 1: Show attacks with small delays for visual appeal
  for (let slot = 0; slot < 4; slot++) {
    const attacker = game.players[activeIdx].board[slot];
    if (attacker) {
      const attackPower = CARD_LIST.find(c => c.id === attacker.card_id)?.attack ?? 1;
      const defender = game.players[opponentIdx].board[slot];
      const attackerName = CARD_LIST.find(c => c.id === attacker.card_id)?.name ?? `Card ${attacker.card_id}`;
      
      // Small staggered delay for each slot
      const attackDelay = currentDelay + (slot * 150);

      if (defender) {
        // Unit vs unit attack
        animations.push({
          id: `attack-${activeIdx}-${slot}`,
          type: 'unit-attack',
          sourceSlot: slot,
          targetSlot: slot,
          damage: attackPower,
          unitName: attackerName,
          delay: attackDelay,
          duration: ATTACK_DURATION
        });
      } else {
        // Attack player directly
        animations.push({
          id: `player-attack-${activeIdx}-${slot}`,
          type: 'player-damage',
          sourceSlot: slot,
          targetPlayer: opponentIdx,
          damage: attackPower,
          unitName: attackerName,
          delay: attackDelay,
          duration: ATTACK_DURATION
        });
      }
    }
  }

  // Account for the longest attack delay (slot 3 + attack duration)
  currentDelay += (3 * 150) + ATTACK_DURATION + SEQUENCE_GAP;

  // Phase 2: Show damage being taken with stagger
  for (let slot = 0; slot < 4; slot++) {
    const attacker = game.players[activeIdx].board[slot];
    const defender = game.players[opponentIdx].board[slot];
    
    if (attacker && defender) {
      const attackPower = CARD_LIST.find(c => c.id === attacker.card_id)?.attack ?? 1;
      const defenderAttack = CARD_LIST.find(c => c.id === defender.card_id)?.attack ?? 1;
      
      // Small staggered delay for damage animations too
      const damageDelay = currentDelay + (slot * 100);
      
      // Defender takes damage
      animations.push({
        id: `damage-${opponentIdx}-${slot}`,
        type: 'unit-damage',
        targetSlot: slot,
        damage: attackPower,
        delay: damageDelay,
        duration: DAMAGE_DURATION
      });
      
      // Attacker takes counter-damage (slightly delayed)
      animations.push({
        id: `counter-damage-${activeIdx}-${slot}`,
        type: 'unit-damage',
        targetSlot: slot,
        damage: defenderAttack,
        delay: damageDelay + 200,
        duration: DAMAGE_DURATION
      });
    }
  }

  // Account for counter-damage delay + duration  
  currentDelay += (3 * 100) + 200 + DAMAGE_DURATION + SEQUENCE_GAP;

  // Phase 3: Show units dying
  for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
    for (let slot = 0; slot < 4; slot++) {
      const unit = game.players[playerIdx].board[slot];
      if (unit) {
        // Calculate if unit would die
        const unitAttack = CARD_LIST.find(c => c.id === unit.card_id)?.attack ?? 1;
        let damageTaken = 0;
        
        // Check if there's an opponent unit in the same slot
        const opponentUnit = game.players[1 - playerIdx].board[slot];
        if (opponentUnit) {
          const opponentAttack = CARD_LIST.find(c => c.id === opponentUnit.card_id)?.attack ?? 1;
          damageTaken = opponentAttack;
        }
        
        if (unit.current_hp - damageTaken <= 0) {
          const unitName = CARD_LIST.find(c => c.id === unit.card_id)?.name ?? `Card ${unit.card_id}`;
          animations.push({
            id: `death-${playerIdx}-${slot}`,
            type: 'unit-death',
            targetSlot: slot,
            unitName: unitName,
            delay: currentDelay,
            duration: DEATH_DURATION
          });
        }
      }
    }
  }

  const totalDuration = currentDelay + DEATH_DURATION;

  return {
    animations,
    totalDuration
  };
}

/**
 * Gets animations for a specific slot at a given time
 */
export function getActiveAnimationsForSlot(
  animations: AttackAnimation[], 
  slot: number, 
  playerIdx: number,
  currentTime: number
): AttackAnimation[] {
  console.log(`getActiveAnimationsForSlot: slot=${slot}, playerIdx=${playerIdx}, currentTime=${currentTime}, totalAnimations=${animations.length}`);
  
  const filtered = animations.filter(anim => {
    const isActive = currentTime >= anim.delay && currentTime <= anim.delay + anim.duration;
    const isTargetSlot = (anim.targetSlot === slot && (anim.type === 'unit-damage' || anim.type === 'unit-death'));
    const isSourceSlot = (anim.sourceSlot === slot && anim.type === 'unit-attack');
    
    const matches = isActive && (isTargetSlot || isSourceSlot);
    
    if (matches) {
      console.log(`Animation match for slot ${slot}:`, anim);
    }
    
    return matches;
  });
  
  console.log(`Filtered animations for slot ${slot}:`, filtered);
  return filtered;
}