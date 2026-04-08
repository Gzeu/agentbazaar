/**
 * Example: Consumer Agent
 * Discovers a data-fetching service, validates AP2 mandate, and executes a task.
 */
import AgentBazaarSDK, { MandateConfig } from "../index";

const sdk = new AgentBazaarSDK({
  networkUrl: "https://devnet-api.multiversx.com",
  registryAddress: "erd1qqqqqqqqqqqqqpgqREGISTRY",
  escrowAddress:   "erd1qqqqqqqqqqqqqpgqESCROW",
  reputationAddress: "erd1qqqqqqqqqqqqqpgqREPUTATION",
  chainId: "D",
});

async function main() {
  const CONSUMER_ADDRESS = "erd1yourconsumeraddresshere";

  // 1. AP2 mandate config — limits autonomous spending
  const mandate: MandateConfig = {
    consumer: CONSUMER_ADDRESS,
    maxSpendPerTask: "5000000000000000", // max 0.005 EGLD per task
    maxSpendTotal: "100000000000000000", // max 0.1 EGLD total
    allowedCategories: ["data-fetching", "compute"],
    expiresAt: Date.now() + 3_600_000, // valid 1 hour
  };

  // 2. Discover available data-fetching services
  const services = await sdk.discoverServices("data-fetching");
  console.log(`Found ${services.length} data-fetching services`);

  if (services.length === 0) {
    console.log("No services available yet — register a provider first.");
    return;
  }

  const target = services[0];
  console.log(`Using service: ${target.name} (${target.serviceId})`);

  // 3. Request quote
  const quote = await sdk.requestQuote(target.serviceId, { symbol: "EGLD" });
  console.log(`Quote: ${quote.price} (valid until ${new Date(quote.validUntil).toISOString()})`);

  // 4. Validate mandate before buying
  const mandateCheck = await sdk.validateMandate(mandate, target.serviceId, quote.price);
  if (!mandateCheck.valid) {
    console.error(`Mandate rejected: ${mandateCheck.reason}`);
    return;
  }

  // 5. Execute task
  const result = await sdk.executeTask(
    CONSUMER_ADDRESS,
    target.serviceId,
    { symbol: "EGLD" },
    quote.price,
    mandate
  );

  console.log(`Task completed in ${result.latencyMs}ms`);
  console.log(`Result hash: ${result.resultHash}`);
  console.log(`Payload:`, result.payload);
}

main().catch(console.error);
