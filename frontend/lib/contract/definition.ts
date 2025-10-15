import { contracts } from "@polkadot-api/descriptors";
import { defineContract } from "@reactive-dot/core";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0xa236c84dd0a312040252c756571b3cafeeeae239";

export const cardsOnChain = defineContract({
  type: "ink",
  descriptor: contracts.cards_on_chain,
});
