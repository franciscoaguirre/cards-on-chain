// `dot` is the name we gave to `npx papi add`
import { contracts } from "@polkadot-api/descriptors"
import { createClient, FixedSizeBinary } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { createInkSdk } from "@polkadot-api/sdk-ink"

const contractAddressV0 = "0xa236c84dd0a312040252c756571b3cafeeeae239";
const player1AccountId = "12uQNgNAQwZzk7inJHEVetMH3wyX2pvw5Yey2SxTGNZgdQeS";
const player1Address = "0x4e85bc23e9d3ec6acbfa11a63083a1752cab91a7";
const _player2AccountId = "1ZXYVRKSYyYLi3HVapaPvVGSgjkJmP1jzRJmn2qts98Ly8p";
 
// Connect to the polkadot relay chain.
const client = createClient(
  // Polkadot-SDK Nodes have issues, see the documentation for more info
  // on this enhancer https://papi.how/providers/enhancers#polkadot-sdk-compatibility-layer
  withPolkadotSdkCompat(getWsProvider("wss://testnet-passet-hub.polkadot.io")),
)
const inkSdk = createInkSdk(client);
const gameContract = inkSdk.getContract(contracts.cards_on_chain, contractAddressV0);

const gameState = await gameContract.query("get_game_state", { origin: player1AccountId, data: { game_id: 1 } });

if (gameState.success) {
  console.dir({ state: gameState.value.response });
} else {
  console.log("Game state query failed!");
}

const playerGame = await gameContract.query("get_player_game", { origin: player1AccountId, data: { player: FixedSizeBinary.fromHex(player1Address) } });

if (playerGame.success) {
  console.dir({ gameId: playerGame.value.response });
} else {
  console.log("Player game query failed!");
}
