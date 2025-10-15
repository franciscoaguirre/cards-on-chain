import { createInkSdk } from "@polkadot-api/sdk-ink";
import { idle, MutationError, pending } from "@reactive-dot/core";
import { AsyncValue } from "@reactive-dot/core";
import { PolkadotClient, TxEvent } from "polkadot-api";
import { CONTRACT_ADDRESS } from "./definition";
import { contracts } from "@polkadot-api/descriptors";

export const checkStatus = (status: AsyncValue<TxEvent, MutationError>) => {
  switch (status) {
    case idle:
      return "No transaction submitted yet.";
    case pending:
      return "Submitting transaction...";
    default:
      if (status instanceof MutationError) {
        return "Error submitting transaction!";
      }
      return `Submitted tx with hash: ${status.txHash}, current state: ${status.type}`;
  }
};

export const getContract = (client: PolkadotClient) =>
  createInkSdk(client).getContract(contracts.cards_on_chain, CONTRACT_ADDRESS);
