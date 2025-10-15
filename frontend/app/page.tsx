"use client";

import { useState, useEffect, useCallback } from "react";
import { type PolkadotSigner } from "polkadot-api";
import { SelectAccount } from "@/components/SelectAccount";
import { FindOpponent } from "@/components/stages/FindOpponent";
import { GameBoard } from "@/components/game-board";
import { DebugLog } from "@/components/debug-log";
import { useGetPlayerGame, useGetGameState } from "@/lib/contract/hooks";
import type { Game, GameStatus } from "@/lib/contract/types";

type AppStage = "connect" | "findOpponent" | "game" | "loading";

export default function Home() {
  const [stage, setStage] = useState<AppStage>("connect");
  const [signer, setSigner] = useState<PolkadotSigner | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<Game | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const { execute: getPlayerGame } = useGetPlayerGame();
  const { execute: getGameState } = useGetGameState();

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, message]);
  }, []);

  const handleAccountSelected = async (selectedSigner: PolkadotSigner) => {
    setSigner(selectedSigner);
    setStage("loading");
    addLog("Wallet connected successfully");
    
    // Check if player already has an ongoing game
    try {
      addLog("Checking for existing games...");
      const playerGameResult = await getPlayerGame(selectedSigner);
      
      if (playerGameResult && playerGameResult.success && playerGameResult.value.response) {
        const gameId = playerGameResult.value.response;
        addLog(`Found existing game with ID: ${gameId}`);
        const gameStateResult = await getGameState(selectedSigner, gameId);
        
        if (gameStateResult && gameStateResult.success && gameStateResult.value.response) {
          // Player has an ongoing game, jump directly to game board
          const gameState = gameStateResult.value.response;
          setGameId(gameId);
          setGameState(gameState);
          setStage("game");
          addLog("Resuming existing game...");
        } else {
          // Game exists but not in progress, go to find opponent
          setStage("findOpponent");
          addLog("No active game found, ready to find opponent");
        }
      } else {
        // No existing game, go to find opponent
        setStage("findOpponent");
        addLog("No existing game found, ready to find opponent");
      }
    } catch (error) {
      addLog(`Error checking game state: ${error}`);
      setStage("findOpponent");
    }
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

      {stage === "loading" && (
        <div className="container mx-auto p-4 max-w-2xl">
          <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-center">{"<LOADING>"}</h2>
            <p className="text-center text-sm text-muted-foreground">
              Checking for existing games...
            </p>
            <div className="w-full">
              <div className="h-2 w-full bg-muted rounded">
                <div className="h-2 bg-primary rounded animate-pulse w-1/2" />
              </div>
            </div>
          </section>
        </div>
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
            gameState={gameState}
            addLog={addLog} 
          />
          <DebugLog logs={logs} />
        </div>
      )}
    </main>
  );
}
