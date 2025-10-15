"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useConnectedWallets } from "@reactive-dot/react"
import { GameBoard } from "@/components/game-board"
import { DebugLog } from "@/components/debug-log"

export default function GameWaiting() {
    const router = useRouter()
    const wallets = useConnectedWallets()
    const [gameStarted, setGameStarted] = useState(false)
    const [logs, setLogs] = useState<string[]>([])

    useEffect(() => {
        if (wallets.length === 0) {
            router.replace("/")
        }
    }, [wallets, router])

    useEffect(() => {
        const id = setTimeout(() => {
            setGameStarted(true)
        }, 3000)
        return () => clearTimeout(id)
    }, [router])

    if (gameStarted) {
        return (
            <main className="min-h-screen crt-effect">
                <div className="container mx-auto p-4 max-w-3xl">
                    <GameBoard addLog={(msg) => setLogs((prev) => [...prev, msg])} />
                    <DebugLog logs={logs} />
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen crt-effect">
            <div className="container mx-auto p-4 max-w-2xl">
                <header className="mb-6 pixel-border bg-card p-4">
                    <h1 className="text-2xl font-bold text-primary text-glow font-mono text-center">{"<MATCHMAKING>"}</h1>
                    <p className="text-xs text-muted-foreground text-center mt-1">Waiting for opponent to connect…</p>
                </header>

                <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Your wallet is connected. Sit tight while we find an opponent.
                    </div>
                    <div className="w-full">
                        <div className="h-2 w-full bg-muted rounded">
                            <div className="h-2 bg-primary rounded animate-pulse" style={{ width: "66%" }} />
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">This page will update when an opponent joins.</div>
                </section>
            </div>
        </main>
    )
}


