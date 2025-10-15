interface EnergyDisplayProps {
  current: number;
  max: number;
}

export function ManaDisplay({ current, max }: EnergyDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-primary">ENERGY:</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`
              w-3 h-3 border border-primary
              ${i < current ? "bg-primary" : "bg-muted/20"}
            `}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {current}/{max}
      </span>
    </div>
  );
}
