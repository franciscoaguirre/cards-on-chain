import { useState, useCallback } from "react";
import { contract } from "@/lib/client";
import type { PolkadotSigner } from "polkadot-api";

// Generic async hook with loading state
function useAsyncCall<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn(...args);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Async call error:", err);
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { execute, loading, error };
}

// Contract call hooks using the generic hook
export const useRegisterForMatch = () => {
  return useAsyncCall(async (signer: PolkadotSigner) => {
    return await contract.send("register_for_match", { signer });
  });
};

export const useGetGameState = () => {
  return useAsyncCall(async (gameId: number) => {
    return await contract.query.get_game_state({ game_id: gameId });
  });
};

export const useGetPlayerGame = () => {
  return useAsyncCall(async (player: string) => {
    return await contract.query.get_player_game({ player });
  });
};

export const useSubmitTurnActions = () => {
  return useAsyncCall(async (signer: PolkadotSigner, gameId: number, actions: any[]) => {
    return await contract.send("submit_turn_actions", { 
      signer,
      args: [gameId, actions] 
    });
  });
};