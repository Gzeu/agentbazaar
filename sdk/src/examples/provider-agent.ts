/**
 * Example: Provider Agent
 * Registers a data-fetching service and handles incoming task requests.
 */
import AgentBazaarSDK from "../index";

const sdk = new AgentBazaarSDK({
  networkUrl: "https://devnet-api.multiversx.com",
  registryAddress: "erd1qqqqqqqqqqqqqpgqREGISTRY",
  escrowAddress:   "erd1qqqqqqqqqqqqqpgqESCROW",
  reputationAddress: "erd1qqqqqqqqqqqqqpgqREPUTATION",
  chainId: "D",
});

async function main() {
  const PROVIDER_ADDRESS = "erd1yourprovideraddresshere";

  // 1. Register service
  const txData = await sdk.registerService(PROVIDER_ADDRESS, {
    serviceId: "coingecko-price-v1",
    name: "CoinGecko Price Fetcher",
    category: "data-fetching",
    description: "Returns live token price from CoinGecko for any EGLD-tradeable asset.",
    pricePerCall: "1000000000000000", // 0.001 EGLD
    endpoint: "https://your-provider.example.com/mcp/coingecko-price-v1",
    inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] },
    outputSchema: { type: "object", properties: { price: { type: "number" }, currency: { type: "string" } } },
    maxLatencyMs: 800,
    metadataHash: "QmPlaceholderIPFSHashHere",
  });
  console.log("Register tx (sign & broadcast):", txData);

  // 2. Expose MCP-compatible handler (integrate with Express/Fastify)
  const handler = sdk.createMCPHandler(
    {
      serviceId: "coingecko-price-v1",
      name: "CoinGecko Price Fetcher",
      category: "data-fetching",
      description: "Live token price",
      pricePerCall: "1000000000000000",
      endpoint: "/mcp/coingecko-price-v1",
      inputSchema: {},
      outputSchema: {},
      maxLatencyMs: 800,
      metadataHash: "",
    },
    async (input, taskId) => {
      const { symbol } = input as { symbol: string };
      console.log(`[Provider] Handling taskId=${taskId} for symbol=${symbol}`);
      // In production: fetch from CoinGecko API
      return { price: 42.5, currency: "USD", symbol, timestamp: Date.now() };
    }
  );
  console.log(`MCP handler ready at path: ${handler.path}`);
}

main().catch(console.error);
