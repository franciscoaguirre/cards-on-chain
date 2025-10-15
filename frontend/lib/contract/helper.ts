import { idle, MutationError, pending } from "@reactive-dot/core";
import { AsyncValue } from "@reactive-dot/core";
import { TxEvent } from "polkadot-api";

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
