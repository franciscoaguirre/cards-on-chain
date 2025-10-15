"use client"

import { CARDS } from "@/lib/cards"
interface BoardSlotProps {
  card: {
    id: number
    name: string
    cost: number
    attack: number
    health: number
  } | null
  onClick?: () => void
  isPlayable?: boolean
  isOpponent?: boolean
}

export function BoardSlot({ card, onClick, isPlayable, isOpponent }: BoardSlotProps) {
  if (card) {
    const image = CARDS[card.name as keyof typeof CARDS]?.image
    return (
      <div
        className={`
          w-full aspect-[3/4] pixel-border p-2 flex flex-col justify-between
          ${isOpponent ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}
        `}
      >
        {/* Name */}
        <div className="text-xs font-bold leading-tight text-center break-words">{card.name}</div>

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
        <div className="flex justify-between text-sm font-bold">
          <span>{card.attack}</span>
          <span>{card.health}</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={!isPlayable}
      className={`
        w-full aspect-[3/4] border-2 border-dashed
        ${isPlayable
          ? "border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer animate-pulse"
          : "border-muted bg-muted/5"
        }
        transition-colors duration-200
      `}
    >
      {isPlayable && <div className="text-xs text-primary font-bold">{"[PLAY]"}</div>}
    </button>
  )
}
