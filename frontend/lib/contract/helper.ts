import { createInkSdk } from "@polkadot-api/sdk-ink";
import { PolkadotClient } from "polkadot-api";
import { CONTRACT_ADDRESS } from "./definition";
import { contracts } from "@polkadot-api/descriptors";

export const getContract = (client: PolkadotClient) =>
  createInkSdk(client).getContract(contracts.cards_on_chain, CONTRACT_ADDRESS);
