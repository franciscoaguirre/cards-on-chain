import { defineContract } from "@reactive-dot/core";
import * as descriptors from "@polkadot-api/descriptors";

// Ensure you've added the contract metadata via:
// npx papi ink add "/absolute/path/to/backend/target/ink/cards_on_chain/metadata.json" --key cards_on_chain
// so it becomes available under contracts.cards_on_chain

export const cardsOnChain = defineContract({
  type: "ink",
  // Adjust the key below if you used a different one when adding metadata
  descriptor: (descriptors as any).contracts?.cards_on_chain,
});
