"use client";

import { useEffect, useState } from "react";
import { Card as GameCard } from "@/components/card";
import { BoardSlot } from "@/components/board-slot";
import { ManaDisplay } from "@/components/mana-display";
import { Button } from "@/components/ui/button";
import {
  useSubmitTurnActions,
} from "@/lib/contract/hooks";
import { CARD_LIST } from "@/lib/cards";
import { Enum, type PolkadotSigner } from "polkadot-api";
import type { ActionType, Game } from "@/lib/contract/types";
import { 
  checkGameEndAfterResolution, 
  getUnitsToBeDestroyed, 
  getPlayerDamage 
} from "@/lib/auto-resolution";
import { 
  getActiveAnimationsForSlot, 
  type CombatSequence, 
  type AttackAnimation 
} from "@/lib/attack-animations";

interface Card {
  id: number;
  name: string;
  cost: number;
  attack: number;
  health: number;
}

interface GameBoardProps {
  signer: PolkadotSigner;
  gameId: number;
  gameState: Game | null;
  refreshGameState: () => void;
  addLog: (message: string) => void;
}

export function GameBoard({ signer, gameId, gameState, refreshGameState, addLog }: GameBoardProps) {
  const { execute: submitTurnActions, loading: turnLoading, error: turnError } = useSubmitTurnActions();
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [playerBoard, setPlayerBoard] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [opponentBoard, setOpponentBoard] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [opponentHandCount, setOpponentHandCount] = useState(7);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [energy, setEnergy] = useState(1);
  const [maxEnergy, setMaxEnergy] = useState(1);
  const [turn, setTurn] = useState(1);
  const [pendingActions, setPendingActions] = useState<ActionType[]>([]);
  const [combatSequence, setCombatSequence] = useState<CombatSequence | null>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize game state from props if provided (for resumed games)
  useEffect(() => {
    if (gameState) {
      console.log("Contract game state:", gameState);
      
      // TODO: Determine which player index is the current signer
      // For now, assume player 0 is the current player
      const currentPlayerIndex = 0;
      const currentPlayer = gameState.players[currentPlayerIndex];
      const opponent = gameState.players[1 - currentPlayerIndex];
      
      // Determine whose turn it is using active_idx
      const isCurrentPlayerTurn = gameState.active_idx === currentPlayerIndex;
      const activePlayer = gameState.players[gameState.active_idx];
      
      // Set game state from contract
      setTurn(gameState.turn);
      setEnergy(activePlayer.energy);
      setMaxEnergy(activePlayer.max_energy);
      setOpponentHandCount(opponent.hand.length);
      
      // Map hand cards from CardId to actual card data
      const playerHand = currentPlayer.hand.map((cardId) => {
        const cardConfig = CARD_LIST.find(card => card.id === cardId);
        return cardConfig ? {
          id: cardId,
          name: cardConfig.name,
          cost: cardConfig.cost,
          attack: cardConfig.attack,
          health: cardConfig.health,
        } : {
          id: cardId,
          name: `Unknown Card ${cardId}`,
          cost: 1,
          attack: 1,
          health: 1,
        };
      });
      setPlayerHand(playerHand);
      
      // Map board state from contract using actual card data
      const playerBoardState = currentPlayer.board.map(unit => {
        if (!unit) return null;
        const cardConfig = CARD_LIST.find(card => card.id === unit.card_id);
        return cardConfig ? {
          id: unit.card_id,
          name: cardConfig.name,
          cost: cardConfig.cost,
          attack: cardConfig.attack,
          health: unit.current_hp, // Use current HP from game state
        } : {
          id: unit.card_id,
          name: `Unknown Unit ${unit.card_id}`,
          cost: 1,
          attack: 1,
          health: unit.current_hp,
        };
      });
      setPlayerBoard(playerBoardState);
      
      const opponentBoardState = opponent.board.map(unit => {
        if (!unit) return null;
        const cardConfig = CARD_LIST.find(card => card.id === unit.card_id);
        return cardConfig ? {
          id: unit.card_id,
          name: cardConfig.name,
          cost: cardConfig.cost,
          attack: cardConfig.attack,
          health: unit.current_hp, // Use current HP from game state
        } : {
          id: unit.card_id,
          name: `Unknown Unit ${unit.card_id}`,
          cost: 1,
          attack: 1,
          health: unit.current_hp,
        };
      });
      setOpponentBoard(opponentBoardState);
      
      addLog(`Game resumed: Turn ${gameState.turn}, Energy ${activePlayer.energy}/${activePlayer.max_energy}`);
      addLog(`${isCurrentPlayerTurn ? "Your turn" : "Opponent's turn"}`);
    }
  }, [gameState, addLog]);

  // Initialize game for new games (when no gameState is provided)
  useEffect(() => {
    if (!gameState) {
      // For new games, start with empty boards and no cards
      setPlayerHand([]);
      setPlayerBoard([null, null, null, null]);
      setOpponentBoard([null, null, null, null]);
      setOpponentHandCount(0);
      addLog("New game started - boards are empty");
    }
  }, [gameState, addLog]);

  // Animation timer effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAnimating && combatSequence) {
      intervalId = setInterval(() => {
        setAnimationTime(prev => {
          const newTime = prev + 50; // Update every 50ms
          if (newTime >= combatSequence.totalDuration) {
            setIsAnimating(false);
            setCombatSequence(null);
            setAnimationTime(0);
            return 0;
          }
          return newTime;
        });
      }, 50);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnimating, combatSequence]);

  const handleCardSelect = (cardId: number) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
      addLog("Card deselected");
    } else {
      setSelectedCard(cardId);
      const card = playerHand.find((c) => c.id === cardId);
      addLog(`Selected: ${card?.name}`);
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    if (selectedCard === null) {
      addLog("No card selected");
      return;
    }

    if (playerBoard[slotIndex] !== null) {
      addLog("Slot occupied");
      return;
    }

    const card = playerHand.find((c) => c.id === selectedCard);
    if (!card) return;

    if (card.cost > energy) {
      addLog("Not enough energy");
      return;
    }

    // Play the card
    const newBoard = [...playerBoard];
    newBoard[slotIndex] = card;
    setPlayerBoard(newBoard);

    // Remove from hand
    const handIndex = playerHand.findIndex((c) => c.id === selectedCard);
    setPlayerHand(playerHand.filter((_, i) => i !== handIndex));

    // Deduct energy
    setEnergy(energy - card.cost);

    addLog(`Played ${card.name} to slot ${slotIndex + 1}`);
    // Queue on-chain action in order
    setPendingActions((prev) => [
      ...prev,
      ...[
        Enum('PlayCard', { hand_index: handIndex, slot_index: slotIndex }),
      ]
    ]);
    setSelectedCard(null);
  };

  const handleDrawCard = () => {
    //  fn draw_card(&self, game: &mut Game, player_idx: usize)
    if (playerHand.length >= 10) {
      addLog("Hand is full");
      return;
    }

    const newCard: Card = {
      id: Date.now(),
      name: `Card_${Math.floor(Math.random() * 999)}`,
      cost: Math.floor(Math.random() * 5) + 1,
      attack: Math.floor(Math.random() * 5) + 1,
      health: Math.floor(Math.random() * 5) + 1,
    };

    setPlayerHand([...playerHand, newCard]);
    addLog(`Drew ${newCard.name}`);
  };

  const playAttackAnimation = () => {
    if (!isAnimating) {
      const testSequence = {
        animations: [
          {
            id: 'test-attack-0',
            type: 'unit-attack' as const,
            sourceSlot: 0,
            delay: 0,
            duration: 2000
          },
          {
            id: 'test-damage-1',
            type: 'unit-damage' as const,
            targetSlot: 1,
            damage: 5,
            delay: 1000,
            duration: 2000
          }
        ],
        totalDuration: 3000
      };
      
      setCombatSequence(testSequence);
      setAnimationTime(0);
      setIsAnimating(true);
    }
  };

  const handleEndTurn = async () => {
    if (isAnimating) {
      addLog("⏳ Animation in progress, please wait...");
      return;
    }

    // First submit the transaction.
    const actionsToSubmit = [...pendingActions, Enum('EndTurn')];
    submitTurnActions(signer, gameId, actionsToSubmit).then((value) => {
      console.log("Submitting actions finally finalized.");
      if (value) {
        setPendingActions([]);
        setTurn(turn + 1);
        setEnergy(maxEnergy);
        addLog(`Turn ${turn + 1} started`);
        addLog("Energy refreshed");
      }
    }).catch((error) => {
      addLog(`[ERROR] Failed to submit turn: ${error}`);
    }).finally(() => {
      refreshGameState();
    });

    // Then play the attack animation
    if (gameState) {
      // Get units that will be destroyed
      const unitsToDestroy = getUnitsToBeDestroyed(gameState);
      if (unitsToDestroy.length > 0) {
        const destroyedNames = unitsToDestroy.map(({ playerIdx, slot }) => {
          const unit = gameState.players[playerIdx].board[slot];
          if (unit) {
            const cardConfig = CARD_LIST.find(card => card.id === unit.card_id);
            const playerName = playerIdx === 0 ? "Your" : "Opponent's";
            return `${playerName} ${cardConfig?.name || `Card ${unit.card_id}`}`;
          }
          return "Unknown unit";
        });
        addLog(`💀 Combat preview: ${destroyedNames.join(", ")} will be destroyed`);
      }

      // Get player damage
      const playerDamage = getPlayerDamage(gameState);
      playerDamage.forEach(({ playerIdx, damage }) => {
        const playerName = playerIdx === 0 ? "You" : "Opponent";
        addLog(`⚔️ Combat preview: ${playerName} will take ${damage} damage`);
      });

      // Check for game end
      const winner = checkGameEndAfterResolution(gameState);
      if (winner !== null) {
        const winnerName = winner === 0 ? "You" : "Opponent";
        addLog(`🏆 Game will end - ${winnerName} wins!`);
      }

      // Play the animation
      playAttackAnimation();
    }
  };

  return (
    <div className="space-y-6">
      {/* Opponent Side */}
      <div className="space-y-4">
        <div className="pixel-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-destructive font-bold">
              {"[OPPONENT]"}
            </span>
            <span className="text-xs text-muted-foreground">
              Cards: {opponentHandCount}
            </span>
          </div>
          <div className="flex gap-1 justify-center min-h-[60px]">
            {Array.from({ length: opponentHandCount }).map((_, i) => (
              <div
                key={i}
                className="w-10 h-14 bg-destructive/20 border-2 border-destructive pixel-border"
              />
            ))}
          </div>
        </div>

        {/* Opponent Board */}
        <div className="grid grid-cols-4 gap-4">
          {opponentBoard.map((card, i) => {
            const animations = combatSequence ? getActiveAnimationsForSlot(
              combatSequence.animations, 
              i, 
              1, // opponent is player index 1
              animationTime
            ) : [];
            
            if (animations.length > 0) {
              console.log(`Opponent slot ${i} has ${animations.length} animations at time ${animationTime}:`, animations);
            }
            
            return (
              <BoardSlot 
                key={i} 
                card={card} 
                isOpponent 
                animations={animations}
              />
            );
          })}
        </div>
      </div>

      {/* Center Divider */}
      <div className="border-t-2 border-dashed border-primary/50 relative">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-background px-4 py-1 border-2 border-primary text-primary text-xs font-bold">
          BATTLEFIELD
        </div>
      </div>

      {/* Player Side */}
      <div className="space-y-4">
        {/* Player Board */}
        <div className="grid grid-cols-4 gap-4">
          {playerBoard.map((card, i) => {
            const animations = combatSequence ? getActiveAnimationsForSlot(
              combatSequence.animations, 
              i, 
              0, // player is player index 0
              animationTime
            ) : [];
            return (
              <BoardSlot
                key={i}
                card={card}
                onClick={() => handleSlotClick(i)}
                isPlayable={selectedCard !== null && card === null}
                animations={animations}
              />
            );
          })}
        </div>

        {/* Player Hand */}
        <div className="pixel-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-primary font-bold">{"[PLAYER]"}</span>
            <div className="flex gap-4">
              <ManaDisplay current={energy} max={maxEnergy} />
              <span className="text-xs text-muted-foreground">
                Turn: {turn}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-center flex-wrap min-h-[120px]">
            {playerHand.map((card, i) => (
              <GameCard
                key={i}
                card={card}
                isSelected={selectedCard === card.id}
                onClick={() => handleCardSelect(card.id)}
                canAfford={card.cost <= energy}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleDrawCard}
            disabled={playerHand.length >= 10}
            className="bevel-button bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold px-6"
          >
            {"[DRAW_CARD]"}
          </Button>
          <Button
            onClick={handleEndTurn}
            disabled={isAnimating}
            className="bevel-button bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-6"
          >
            {isAnimating ? "[ANIMATING...]" : "[END_TURN]"}
          </Button>
        </div>
      </div>
    </div>
  );
}
