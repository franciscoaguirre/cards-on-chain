"use client";

import { CARDS } from "@/lib/cards";
import { AttackAnimation } from "@/lib/attack-animations";

interface BoardSlotProps {
  card: {
    id: number;
    name: string;
    cost: number;
    attack: number;
    health: number;
  } | null;
  onClick?: () => void;
  isPlayable?: boolean;
  isOpponent?: boolean;
  animations?: AttackAnimation[];
}

export function BoardSlot({
  card,
  onClick,
  isPlayable,
  isOpponent,
  animations = [],
}: BoardSlotProps) {
  if (card) {
    const image = CARDS[card.name as keyof typeof CARDS]?.image;
    
    // Debug logging
    if (animations.length > 0) {
      console.log(`BoardSlot ${card.name}:`, {
        animations,
        animationTypes: animations.map(a => a.type)
      });
    }
    
    // Check for active animations
    const isAttacking = animations.some(anim => anim.type === 'unit-attack');
    const isTakingDamage = animations.some(anim => anim.type === 'unit-damage');
    const isDying = animations.some(anim => anim.type === 'unit-death');
    
    // Get damage amount for display
    const damageAnimation = animations.find(anim => anim.type === 'unit-damage');
    const damageAmount = damageAnimation?.damage;
    
    // More debug logging
    if (isAttacking || isTakingDamage || isDying) {
      console.log(`BoardSlot ${card.name} animation states:`, {
        isAttacking,
        isTakingDamage,
        isDying,
        damageAmount
      });
    }
    
    return (
      <div
        className={`
          w-full aspect-[3/4] pixel-border p-2 flex flex-col justify-between relative
          ${isOpponent ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}
          ${isAttacking ? "attack-animation" : ""}
          ${isTakingDamage ? "damage-animation" : ""}
          ${isDying ? "death-animation" : ""}
        `}
      >
        {/* Name */}
        <div className="text-xs font-bold leading-tight text-center break-words">
          {card.name}
        </div>

        {/* Card Art */}
        <div className="flex-1 border border-current/30 bg-muted/20 flex items-center justify-center my-1 overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={card.name}
              className="object-contain w-full h-full"
            />
          ) : (
            <div className="text-[8px] text-muted-foreground">IMG</div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm font-bold">
          <span>{card.attack}</span>
          <span>{card.health}</span>
        </div>
        
        {/* Damage indicator */}
        {isTakingDamage && damageAmount && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="damage-number-animation text-red-600 font-bold text-2xl">
              -{damageAmount}
            </div>
          </div>
        )}
      </div>
    );
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
      {isPlayable && (
        <div className="text-xs text-primary font-bold">{"[PLAY]"}</div>
      )}
    </button>
  );
}
