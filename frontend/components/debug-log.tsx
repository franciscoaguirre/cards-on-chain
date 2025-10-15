"use client"

import { useEffect, useRef } from "react"

interface DebugLogProps {
  logs: string[]
}

export function DebugLog({ logs }: DebugLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div className="mt-6 pixel-border bg-card p-4 max-h-32 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2 border-b border-border pb-1">
        <div className="w-2 h-2 bg-primary animate-pulse" />
        <span className="text-xs font-bold text-primary">{"[DEBUG_LOG.TXT]"}</span>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground font-mono">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-primary">{String(i).padStart(3, "0")}</span>
            <span>{log}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
