"use client"

import { CARDS } from "@/lib/cards"

interface CardProps {
  card: {
    id: number
    name: string
    cost: number
    attack: number
    health: number
  }
  isSelected?: boolean
  onClick?: () => void
  canAfford?: boolean
}

export function Card({ card, isSelected, onClick, canAfford = true }: CardProps) {
  const image = CARDS[card.name as keyof typeof CARDS]?.image
  return (
    <button
      onClick={onClick}
      className={`
        w-32 h-44 pixel-border p-2 flex flex-col justify-between
        transition-all duration-100 relative
        ${isSelected ? "bg-primary text-primary-foreground -translate-y-2 card-glow" : "bg-card text-card-foreground"}
        ${!canAfford ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 cursor-pointer"}
      `}
      disabled={!canAfford}
    >
      {/* Cost */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-accent text-accent-foreground border-2 border-current flex items-center justify-center text-xs font-bold">
        {card.cost}
      </div>

      {/* Name */}
      <div className="text-[10px] font-bold leading-tight text-center break-words">{card.name}</div>

      {/* Card Art */}
      <div className="flex-1 border border-current/30 bg-muted/20 flex items-center justify-center my-1 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={card.name} className="object-contain w-full h-full" />
        ) : (
          <div className="text-[8px] text-muted-foreground">IMG</div>
        )}
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs font-bold">
        <span className="text-destructive">{card.attack}</span>
        <span className="text-primary">{card.health}</span>
      </div>
    </button>
  )
}
