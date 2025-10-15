"use client";

import { useState } from "react";
import { type PolkadotSigner } from "polkadot-api";
import { SelectAccount } from "@/components/SelectAccount";
import { FindOpponent } from "@/components/stages/FindOpponent";
import { GameBoard } from "@/components/game-board";
import { DebugLog } from "@/components/debug-log";

type AppStage = "connect" | "findOpponent" | "game";

export default function Home() {
  const [stage, setStage] = useState<AppStage>("connect");
  const [signer, setSigner] = useState<PolkadotSigner | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleAccountSelected = (selectedSigner: PolkadotSigner) => {
    setSigner(selectedSigner);
    setStage("findOpponent");
    addLog("Wallet connected successfully");
  };

  const handleGameStarted = (newGameId: number) => {
    setGameId(newGameId);
    setStage("game");
    addLog(`Game started with ID: ${newGameId}`);
  };

  return (
    <main className="min-h-screen crt-effect">
      <header className="mb-6 pixel-border bg-card p-4">
        <h1 className="text-2xl font-bold text-primary text-glow font-mono text-center">
          {"<CARDGAME.EXE>"}
        </h1>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Welcome to the game
        </p>
      </header>

      {stage === "connect" && (
        <SelectAccount setSigner={handleAccountSelected} />
      )}

      {stage === "findOpponent" && signer && (
        <FindOpponent 
          signer={signer} 
          onGameStarted={handleGameStarted} 
        />
      )}

      {stage === "game" && signer && gameId && (
        <div className="container mx-auto p-4 max-w-3xl">
          <GameBoard 
            signer={signer}
            gameId={gameId}
            addLog={addLog} 
          />
          <DebugLog logs={logs} />
        </div>
      )}
    </main>
  );
}