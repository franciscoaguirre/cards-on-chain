"use client"

import { useState } from "react"
import { GameBoard } from "@/components/game-board"
import { DebugLog } from "@/components/debug-log"

export default function Home() {
  const [logs, setLogs] = useState<string[]>([
    "> System initialized...",
    "> Loading card_game.exe",
    "> Connection established",
    "> Ready to play",
  ])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `> ${message}`])
  }

  return (
    <main className="min-h-screen crt-effect">
      <div className="container mx-auto p-4 max-w-7xl">
        <header className="mb-6 pixel-border bg-card p-4">
          <h1 className="text-2xl font-bold text-primary text-glow font-mono text-center">{"<CARDGAME.EXE>"}</h1>
          <p className="text-xs text-muted-foreground text-center mt-1">v1.0.0 | Build 1995 | Open Source Edition</p>
        </header>

        <GameBoard addLog={addLog} />

        <DebugLog logs={logs} />
      </div>
    </main>
  )
}
