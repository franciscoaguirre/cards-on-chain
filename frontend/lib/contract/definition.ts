import { defineContract } from "@reactive-dot/core";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xa236c84dd0a312040252c756571b3cafeeeae239";
// Ensure you've added the contract metadata via:
// npx papi ink add "/absolute/path/to/backend/target/ink/cards_on_chain/metadata.json" --key cards_on_chain
// so it becomes available under contracts.cards_on_chain

// Runtime stub descriptor to keep app runnable without generated contract descriptors.
// Real implementation once you run the add command:
import * as descriptors from "@polkadot-api/descriptors";
export const cardsOnChain = defineContract({
  type: "ink",
  descriptor: (descriptors as any).contracts.cards_on_chain,
});

// export const cardsOnChain = defineContract({
//   type: "ink",
//   descriptor: {} as any,
// });
