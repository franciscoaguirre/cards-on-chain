import { useLazyLoadQuery, useContractMutation } from "@reactive-dot/react";
import { useEffect, useState } from "react";
import type { CardId, CardMetadata, Game, GameId } from "./types";
import { cardsOnChain } from "./definition";

// Reads
export function useGetCard(contractAddress: string, cardId: CardId) {
  console.log("[stub] useGetCard", { contractAddress, cardId });
  // Real implementation:
  // const [card] = useLazyLoadQuery((builder) =>
  //   builder.contract(cardsOnChain, contractAddress, (b) =>
  //     b.message("get_card", cardId)
  //   )
  // );
  // return card as CardMetadata | null;
  return null as CardMetadata | null;
}

export function useGetGameState(contractAddress: string, gameId: GameId) {
  console.log("[stub] useGetGameState", { contractAddress, gameId });
  // Real implementation:
  // const [game] = useLazyLoadQuery((builder) =>
  //   builder.contract(cardsOnChain, contractAddress, (b) =>
  //     b.message("get_game_state", gameId)
  //   )
  // );
  // return game as Game | null;
  return null as Game | null;
}

export function useGetPlayerGame(contractAddress: string, player: string) {
  console.log("[stub] useGetPlayerGame", { contractAddress, player });
  // Real implementation:
  // const [gameId] = useLazyLoadQuery((builder) =>
  //   builder.contract(cardsOnChain, contractAddress, (b) =>
  //     b.message("get_player_game", player as any)
  //   )
  // );
  // return (gameId ?? null) as GameId | null;
  return null as GameId | null;
}

// Writes
export function useRegisterForMatch(
  contractAddress: string,
  value: bigint = 0n,
) {
  const [status, rawMutate] = useContractMutation((mutate) => {
    return mutate(cardsOnChain, contractAddress, "register_for_match", {
      value,
    });
  });
  const register = () => rawMutate();
  return [status, register] as const;
}

export function useSubmitTurnActions(
  contractAddress: string,
  value: bigint = 0n,
) {
  const submit = (gameId: number, actions: any[]) => {
    console.log("[stub] submit_turn_actions", {
      contractAddress,
      value,
      gameId,
      actions,
    });
  };
  // Real implementation:
  // const [status, rawMutate] = useContractMutation((mutate) =>
  //   mutate(cardsOnChain, contractAddress, "submit_turn_actions", { value })
  // );
  // const submit = (gameId: number, actions: any[]) =>
  //   rawMutate({ variables: [gameId, actions] } as any);
  // return [status, submit] as const;
  return [undefined, submit] as const;
}

export function useMintCard(contractAddress: string, value: bigint = 0n) {
  const mint = (to: string, metadata: any) => {
    console.log("[stub] mint_card", { contractAddress, value, to, metadata });
  };
  // Real implementation:
  // const [status, rawMutate] = useContractMutation((mutate) =>
  //   mutate(cardsOnChain, contractAddress, "mint_card", { value })
  // );
  // const mint = (to: string, metadata: any) =>
  //   rawMutate({ variables: [to, metadata] } as any);
  // return [status, mint] as const;
  return [undefined, mint] as const;
}

// Listen for GameStarted and invoke callback
export function useGameStartedListener(
  contractAddress: string,
  enabled: boolean,
  onGameStarted: (payload: { gameId: number }) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    // Real implementation with Reactive DOT:
    // useSubscribe(
    //   (builder) =>
    //     builder.contract(cardsOnChain, contractAddress, (b) => b.events()),
    //   {
    //     onData: (evt) => {
    //       if (evt.name === "GameStarted") {
    //         onGameStarted({ gameId: Number(evt.args.game_id) });
    //       }
    // },
    //   }
    // );
  }, [enabled, contractAddress, onGameStarted]);
}
