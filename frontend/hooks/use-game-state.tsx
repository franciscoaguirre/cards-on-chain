"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type GameStateContextValue = {
  gameId: string | null;
  setGameId: (id: string | null) => void;
};

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined,
);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameId, updateGameId] = useState<string | null>(null);

  const setGameId = useCallback((id: string | null) => {
    updateGameId(id);
  }, []);

  const value = useMemo<GameStateContextValue>(
    () => ({ gameId, setGameId }),
    [gameId, setGameId],
  );

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return ctx;
}
