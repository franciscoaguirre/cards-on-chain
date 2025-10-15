"use client"

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
    return (
      <div
        className={`
          w-full aspect-[3/4] pixel-border p-2 flex flex-col justify-between
          ${isOpponent ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}
        `}
      >
        {/* Name */}
        <div className="text-xs font-bold leading-tight text-center break-words">{card.name}</div>

        {/* Card Art Placeholder */}
        <div className="flex-1 border border-current/30 bg-muted/20 flex items-center justify-center my-1">
          <div className="text-[8px] text-muted-foreground">IMG</div>
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
        ${
          isPlayable
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
