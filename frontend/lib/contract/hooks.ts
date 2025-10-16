import { useState, useCallback } from "react";
import { contract } from "@/lib/client";
import { AccountId, Binary, SS58String, TxFinalizedPayload, type PolkadotSigner } from "polkadot-api";
import { ss58ToEthereum } from "@polkadot-api/sdk-ink";
import { ActionType } from "./types";

// Generic async hook with loading state and transaction logging
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
      console.error("❌ Transaction failed:", err);
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { execute, loading, error };
}

const getSs58Account = (signer: PolkadotSigner) => {
  return AccountId().dec(signer.publicKey);
}

const getEthAddress = (account: SS58String): Binary => {
  return ss58ToEthereum(account);
}

// Contract call hooks using the generic hook
export const useRegisterForMatch = () => {
  return useAsyncCall(async (signer: PolkadotSigner): Promise<TxFinalizedPayload> => {
    const ss58Account = getSs58Account(signer);
    
    return new Promise((resolve, reject) => {
      const subscription = contract.send("register_for_match", { origin: ss58Account })
        .signSubmitAndWatch(signer)
        .subscribe({
          next: (result) => {
            if (result.type === "broadcasted") {
              console.log("📡 Transaction broadcasted:", result.txHash);
            } else if (result.type === "txBestBlocksState") {
              console.log("📦 Transaction included in block:", {
                txHash: result.txHash,
                found: result.found
              });
            } else if (result.type === "finalized") {
              console.log("🔒 Transaction finalized:", {
                txHash: result.txHash,
                blockHash: result.block.hash,
                blockNumber: result.block.number
              });
              subscription.unsubscribe();
              resolve(result);
            }
          },
          error: (error) => {
            console.error("❌ Transaction error:", error);
            subscription.unsubscribe();
            reject(error);
          }
        });
    });
  });
};

export const useGetGameState = () => {
  return useAsyncCall(async (signer: PolkadotSigner, gameId: number) => {
    const ss58Account = getSs58Account(signer);
    return await contract.query("get_game_state", { origin: ss58Account, data: { game_id: gameId } });
  });
};

export const useGetPlayerGame = () => {
  return useAsyncCall(async (signer: PolkadotSigner) => {
    const ss58Account = getSs58Account(signer);
    const ethAddress = getEthAddress(ss58Account);
    return await contract.query("get_player_game", { origin: ss58Account, data: { player: ethAddress } });
  });
};

export const useSubmitTurnActions = () => {
  return useAsyncCall(async (signer: PolkadotSigner, gameId: number, actions: ActionType[]): Promise<TxFinalizedPayload> => {
    const ss58Account = getSs58Account(signer);
    
    return new Promise((resolve, reject) => {
      const subscription = contract.send("submit_turn_actions", { 
        origin: ss58Account,
        data: {
          game_id: gameId,
          actions
        }
      }).signSubmitAndWatch(signer)
        .subscribe({
          next: (result) => {
            if (result.type === "broadcasted") {
              console.log("📡 Turn actions broadcasted:", result.txHash);
            } else if (result.type === "txBestBlocksState") {
              console.log("📦 Turn actions included in block:", {
                txHash: result.txHash,
                found: result.found
              });
            } else if (result.type === "finalized") {
              console.log("🔒 Turn actions finalized:", {
                txHash: result.txHash,
                blockHash: result.block.hash,
                blockNumber: result.block.number
              });
              subscription.unsubscribe();
              resolve(result);
            }
          },
          error: (error) => {
            console.error("❌ Turn actions error:", error);
            subscription.unsubscribe();
            reject(error);
          }
        });
    });
  });
};

// Hook for listening to TurnEnded events
export const useTurnEndedListener = () => {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback((gameId: number, onTurnEnded: (event: any) => void) => {
    setListening(true);
    setError(null);
    
    try {
      // Listen to TurnEnded events for the specific game
      const subscription = contract.events.TurnEnded.watch()
        .subscribe({
          next: (event) => {
            console.log("🔄 TurnEnded event received:", event);
            
            // Check if this event is for our game
            if (event.args.game_id === gameId) {
              onTurnEnded(event);
            }
          },
          error: (err) => {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            console.error("❌ TurnEnded listener error:", err);
            setListening(false);
          }
        });
        
      // Return cleanup function
      return () => {
        subscription.unsubscribe();
        setListening(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setListening(false);
      console.error("❌ Failed to start TurnEnded listener:", err);
    }
  }, []);

  return { startListening, listening, error };
};
