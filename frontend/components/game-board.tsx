"use client"

import { useState } from "react"
import { Card as GameCard } from "@/components/card"
import { BoardSlot } from "@/components/board-slot"
import { ManaDisplay } from "@/components/mana-display"
import { Button } from "@/components/ui/button"

interface Card {
  id: number
  name: string
  cost: number
  attack: number
  health: number
}

interface GameBoardProps {
  addLog: (message: string) => void
}

export function GameBoard({ addLog }: GameBoardProps) {
  const [playerHand, setPlayerHand] = useState<Card[]>([
    { id: 1, name: "Firewall", cost: 2, attack: 2, health: 3 },
    { id: 2, name: "Debugger", cost: 3, attack: 3, health: 2 },
    { id: 3, name: "Compiler", cost: 4, attack: 4, health: 4 },
    { id: 4, name: "Parser", cost: 1, attack: 1, health: 2 },
    { id: 5, name: "Kernel", cost: 5, attack: 5, health: 5 },
  ])
  const [playerBoard, setPlayerBoard] = useState<(Card | null)[]>([null, null, null, null])
  const [opponentBoard, setOpponentBoard] = useState<(Card | null)[]>([
    { id: 101, name: "Bug", cost: 2, attack: 2, health: 2 },
    { id: 102, name: "Virus", cost: 3, attack: 3, health: 1 },
    null,
    null,
  ])
  const [opponentHandCount, setOpponentHandCount] = useState(7)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [mana, setMana] = useState(10)
  const [maxMana, setMaxMana] = useState(10)
  const [turn, setTurn] = useState(1)

  const handleCardSelect = (cardId: number) => {
    if (selectedCard === cardId) {
      setSelectedCard(null)
      addLog("Card deselected")
    } else {
      setSelectedCard(cardId)
      const card = playerHand.find((c) => c.id === cardId)
      addLog(`Selected: ${card?.name}`)
    }
  }

  const handleSlotClick = (slotIndex: number) => {
    if (selectedCard === null) {
      addLog("No card selected")
      return
    }

    if (playerBoard[slotIndex] !== null) {
      addLog("Slot occupied")
      return
    }

    const card = playerHand.find((c) => c.id === selectedCard)
    if (!card) return

    if (card.cost > mana) {
      addLog("Not enough mana")
      return
    }

    // Play the card
    const newBoard = [...playerBoard]
    newBoard[slotIndex] = card
    setPlayerBoard(newBoard)

    // Remove from hand
    setPlayerHand(playerHand.filter((c) => c.id !== selectedCard))

    // Deduct mana
    setMana(mana - card.cost)

    addLog(`Played ${card.name} to slot ${slotIndex + 1}`)
    setSelectedCard(null)
  }

  const handleDrawCard = () => {
    if (playerHand.length >= 10) {
      addLog("Hand is full")
      return
    }

    const newCard: Card = {
      id: Date.now(),
      name: `Card_${Math.floor(Math.random() * 999)}`,
      cost: Math.floor(Math.random() * 5) + 1,
      attack: Math.floor(Math.random() * 5) + 1,
      health: Math.floor(Math.random() * 5) + 1,
    }

    setPlayerHand([...playerHand, newCard])
    addLog(`Drew ${newCard.name}`)
  }

  const handleEndTurn = () => {
    setTurn(turn + 1)
    setMana(maxMana)
    addLog(`Turn ${turn + 1} started`)
    addLog("Mana refreshed")
  }

  return (
    <div className="space-y-6">
      {/* Opponent Side */}
      <div className="space-y-4">
        <div className="pixel-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-destructive font-bold">{"[OPPONENT]"}</span>
            <span className="text-xs text-muted-foreground">Cards: {opponentHandCount}</span>
          </div>
          <div className="flex gap-1 justify-center min-h-[60px]">
            {Array.from({ length: opponentHandCount }).map((_, i) => (
              <div key={i} className="w-10 h-14 bg-destructive/20 border-2 border-destructive pixel-border" />
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
              <ManaDisplay current={mana} max={maxMana} />
              <span className="text-xs text-muted-foreground">Turn: {turn}</span>
            </div>
          </div>
          <div className="flex gap-2 justify-center flex-wrap min-h-[120px]">
            {playerHand.map((card) => (
              <GameCard
                key={card.id}
                card={card}
                isSelected={selectedCard === card.id}
                onClick={() => handleCardSelect(card.id)}
                canAfford={card.cost <= mana}
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
  )
}
