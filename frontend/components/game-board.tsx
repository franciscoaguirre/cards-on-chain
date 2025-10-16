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
  gameState?: Game;
  addLog: (message: string) => void;
}

export function GameBoard({ signer, gameId, gameState, addLog }: GameBoardProps) {
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

  const handleEndTurn = async () => {
    // Submit ordered actions for this turn + EndTurn
    const actionsToSubmit = [...pendingActions, Enum('EndTurn')];
    try {
      const result = await submitTurnActions(signer, gameId, actionsToSubmit);
      
      if (result) {
        setPendingActions([]);
        setTurn(turn + 1);
        setEnergy(maxEnergy);
        addLog(`Turn ${turn + 1} started`);
        addLog("Energy refreshed");
      }
    } catch (error) {
      addLog(`[ERROR] Failed to submit turn: ${error}`);
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
          {opponentBoard.map((card, i) => (
            <BoardSlot key={i} card={card} isOpponent />
          ))}
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
          {playerBoard.map((card, i) => (
            <BoardSlot
              key={i}
              card={card}
              onClick={() => handleSlotClick(i)}
              isPlayable={selectedCard !== null && card === null}
            />
          ))}
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
            className="bevel-button bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-6"
          >
            {"[END_TURN]"}
          </Button>
        </div>
      </div>
    </div>
  );
}
