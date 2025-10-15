import { useLazyLoadQuery, useContractMutation } from "@reactive-dot/react";
import { cardsOnChain } from "./definition";
import type { CardId, CardMetadata, Game, GameId } from "./types";

// Reads
export function useGetCard(contractAddress: string, cardId: CardId) {
  const [card] = useLazyLoadQuery((builder) =>
    builder.contract(cardsOnChain, contractAddress, (b) =>
      b.message("get_card", cardId)
    )
  );
  return card as CardMetadata | null;
}

export function useGetGameState(contractAddress: string, gameId: GameId) {
  const [game] = useLazyLoadQuery((builder) =>
    builder.contract(cardsOnChain, contractAddress, (b) =>
      b.message("get_game_state", gameId)
    )
  );
  return game as Game | null;
}

export function useGetPlayerGame(contractAddress: string, player: string) {
  const [gameId] = useLazyLoadQuery((builder) =>
    builder.contract(cardsOnChain, contractAddress, (b) =>
      b.message("get_player_game", player as any)
    )
  );
  return (gameId ?? null) as GameId | null;
}

// Writes
export function useRegisterForMatch(
  contractAddress: string,
  value: bigint = 0n
) {
  return useContractMutation((mutate) =>
    mutate(cardsOnChain, contractAddress, "register_for_match", {
      value,
    })
  );
}

export function useSubmitTurnActions(
  contractAddress: string,
  value: bigint = 0n
) {
  return useContractMutation((mutate) =>
    mutate(cardsOnChain, contractAddress, "submit_turn_actions", {
      value,
      // data provided when calling the returned fn
    })
  );
}

export function useMintCard(contractAddress: string, value: bigint = 0n) {
  return useContractMutation((mutate) =>
    mutate(cardsOnChain, contractAddress, "mint_card", {
      value,
    })
  );
}
