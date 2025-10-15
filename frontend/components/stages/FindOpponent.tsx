import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRegisterForMatch } from "@/lib/contract/hooks";
import type { PolkadotSigner } from "polkadot-api";

interface FindOpponentProps {
  signer: PolkadotSigner;
  onGameStarted: (gameId: number) => void;
}

export function FindOpponent({ signer, onGameStarted }: FindOpponentProps) {
  const { execute: registerForMatch, loading, error } = useRegisterForMatch();
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);

  const handleFindOpponent = async () => {
    try {
      const result = await registerForMatch(signer);
      
      if (result) {
        setIsWaitingForOpponent(true);
        
        // TODO: Listen for GameStarted events from the contract instead of auto-starting
        // Need to implement event listening to detect when another player joins
        // For now, simulate finding an opponent after a delay
        setTimeout(() => {
          onGameStarted(1); // Mock game ID
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to register for match:", err);
    }
  };

  if (isWaitingForOpponent) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-center">{"<WAITING FOR OPPONENT>"}</h2>
          <p className="text-center text-sm text-muted-foreground">
            You're in the matchmaking queue. Waiting for another player to join...
          </p>
          
          <div className="w-full">
            <div className="h-2 w-full bg-muted rounded">
              <div
                className="h-2 bg-primary rounded animate-pulse"
                style={{ width: "80%" }}
              />
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            This page will update when an opponent is found.
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setIsWaitingForOpponent(false)}
          >
            Cancel Search
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <section className="pixel-border bg-card p-6 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-center">Ready to Play</h2>
        <p className="text-center text-sm text-muted-foreground">
          Find an opponent and start a new game
        </p>
        
        {error && (
          <div className="text-red-500 text-sm text-center">
            Error: {error}
          </div>
        )}
        
        <Button 
          onClick={handleFindOpponent}
          disabled={loading}
          className="w-full max-w-xs"
        >
          {loading ? "Registering..." : "Find Opponent"}
        </Button>
      </section>
    </div>
  );
}
