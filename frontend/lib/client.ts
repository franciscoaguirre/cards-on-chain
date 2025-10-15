import { contracts, paseo } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider";
import { CONTRACT_ADDRESS } from "./contract";

export const client = createClient(
  getWsProvider("wss://testnet-passet-hub.polkadot.io"),
);
export const api = client.getTypedApi(paseo);
export const contract = createInkSdk(client).getContract(
  contracts.cards_on_chain,
)(CONTRACT_ADDRESS);
