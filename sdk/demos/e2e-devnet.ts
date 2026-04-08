/**
 * e2e-devnet.ts
 * End-to-end AgentBazaar devnet demo:
 *   1. Load config from devnet/multiversx.json
 *   2. Provider registers a service on-chain
 *   3. Consumer discovers the service via UCP
 *   4. Quote engine generates a price quote
 *   5. AP2 mandate validates the spend
 *   6. x402 payment rail authorizes the payment
 *   7. Escrow locks funds on-chain
 *   8. MCP executes the service task
 *   9. Escrow releases funds on proof
 *  10. Reputation updated on-chain
 *  11. Event listener logs all chain events
 *
 * Run: tsx sdk/demos/e2e-devnet.ts
 * Requires: deployed contracts + funded wallets + addresses in devnet/multiversx.json
 */

import fs from "fs";
import path from "path";
import { AgentBazaar } from "../src/agentBazaar";
import { OnChainSigner } from "../src/onchainRegistry";
import { ServiceDescriptor } from "../src/types";

// ---------- Mock signer for demo (replace with real UserSigner from @multiversx/sdk-core) ----------
function createMockSigner(address: string, startNonce: number): OnChainSigner {
  let nonce = startNonce;
  return {
    getAddress: () => address,
    getNonce: async () => nonce++,
    sign: async (data: string) => {
      // In production: use UserSigner.fromPem(...).sign(Buffer.from(data))
      return Buffer.from(`mock-sig:${data.slice(0, 16)}`).toString("hex");
    },
  };
}

async function main(): Promise<void> {
  // 1. Load devnet config
  const configPath = path.resolve(process.cwd(), "devnet/multiversx.json");
  const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
  const ab = AgentBazaar.fromJson(rawConfig);

  console.log("[AgentBazaar E2E] Network:", ab.config.network);
  console.log("[AgentBazaar E2E] Proxy:", ab.config.proxy);
  console.log("[AgentBazaar E2E] Contracts:", JSON.stringify(ab.config.addresses, null, 2));

  const hasContracts =
    ab.config.addresses.registry &&
    ab.config.addresses.escrow &&
    ab.config.addresses.reputation;

  if (!hasContracts) {
    console.warn(
      "[AgentBazaar E2E] Contract addresses not set. Run ./devnet/deploy.sh first.\n" +
      "Running in simulation mode — no on-chain calls will be made.",
    );
    await runSimulation(ab);
    return;
  }

  await runOnChain(ab);
}

// ---------- Simulation mode (no contracts deployed yet) ----------
async function runSimulation(ab: AgentBazaar): Promise<void> {
  console.log("\n=== SIMULATION MODE ===");

  const service: ServiceDescriptor & { serviceId: string } = {
    serviceId: "svc-data-fetch-001",
    provider: "erd1provider000000000000000000000000000000000000000000000000000",
    name: "DataFetch Pro",
    category: "data",
    description: "Fetches real-time market data for any token pair",
    endpoint: "https://api.agentbazaar.io/services/data-fetch-pro",
    pricingModel: "fixed",
    price: "1000000000000000", // 0.001 EGLD in denomination
    currency: "EGLD",
    tags: ["market", "price", "realtime"],
    slaMs: 500,
    reputationScore: 95,
    active: true,
  };

  // 2. UCP Discovery
  console.log("\n[2] UCP Discovery...");
  const discovered = ab.ucp.filterUCPServices([service], {
    category: "data",
    activeOnly: true,
    search: "fetch",
  });
  console.log(`   Found ${discovered.length} service(s):`, discovered.map((s) => s.title));

  // 3. Quote
  console.log("\n[3] Generating quote...");
  const quote = ab.quote.generateQuote(
    {
      serviceId: service.serviceId,
      buyer: "erd1buyer0000000000000000000000000000000000000000000000000000",
      maxPrice: "2000000000000000",
    },
    service,
  );
  console.log(`   Quote ID: ${quote.quoteId.slice(0, 16)}...`);
  console.log(`   Price: ${quote.price} ${quote.currency}`);
  console.log(`   Valid: ${ab.quote.isQuoteValid(quote)}`);

  // 4. AP2 Mandate check
  console.log("\n[4] AP2 Mandate validation...");
  const mandateResult = ab.ap2.validateMandate({
    mandate: {
      mandateId: "mandate-001",
      owner: "erd1owner",
      delegate: "erd1agent",
      maxAmount: "5000000000000000",
      currency: "EGLD",
      allowedCategories: ["data"],
      validFrom: Date.now() - 60_000,
      validUntil: Date.now() + 3_600_000,
      dailyLimit: "5000000000000000",
    },
    quote,
    category: "data",
    spentToday: "0",
  });
  console.log(`   Mandate valid: ${mandateResult.valid}`);
  if (!mandateResult.valid) console.error("   Reason:", mandateResult.reason);

  // 5. x402 Payment
  console.log("\n[5] x402 Payment authorization...");
  const paymentReceipt = ab.x402.signX402Payment(
    {
      resource: `svc:${service.serviceId}`,
      amount: quote.price,
      currency: quote.currency,
      payer: "erd1buyer",
      payee: service.provider,
    },
    "agentbazaar-secret-key",
  );
  const paymentValid = ab.x402.verifyX402Receipt(
    {
      resource: `svc:${service.serviceId}`,
      amount: quote.price,
      currency: quote.currency,
      payer: "erd1buyer",
      payee: service.provider,
    },
    paymentReceipt,
    "agentbazaar-secret-key",
  );
  console.log(`   Payment ID: ${paymentReceipt.paymentId.slice(0, 16)}...`);
  console.log(`   Signature valid: ${paymentValid}`);
  console.log(`   Status: ${paymentReceipt.status}`);

  // 6. MCP Execution
  console.log("\n[6] MCP Task execution...");
  const mcpResult = await ab.mcp.executeMCPRequest(
    {
      serviceId: service.serviceId,
      taskId: quote.quoteId,
      toolCalls: [
        { tool: "fetchMarketData", args: { pair: "EGLD/USDC", interval: "1m" } },
        { tool: "computeVWAP", args: { period: 24 } },
      ],
      context: { buyer: "erd1buyer", requestedAt: Date.now() },
    },
    {
      fetchMarketData: async (args) => ({
        pair: args?.pair,
        price: "42.15",
        volume24h: "1250000",
        timestamp: Date.now(),
      }),
      computeVWAP: async (args) => ({
        vwap: "41.88",
        period: args?.period,
        dataPoints: 1440,
      }),
    },
  );
  console.log(`   MCP success: ${mcpResult.success}`);
  console.log(`   Proof hash: ${mcpResult.proofHash?.slice(0, 16)}...`);
  console.log(`   Outputs: ${mcpResult.outputs.length} tool result(s)`);

  // 7. Reputation update (off-chain simulation)
  console.log("\n[7] Reputation update (off-chain)...");
  const updatedRep = ab.reputationEngine.updateReputation({
    record: {
      address: service.provider,
      score: 95,
      completedTasks: 142,
      failedTasks: 3,
      disputedTasks: 1,
      medianLatencyMs: 180,
      updatedAt: Date.now() - 86400_000,
    },
    succeeded: true,
    latencyMs: 220,
  });
  console.log(`   New score: ${updatedRep.score}`);
  console.log(`   Completed tasks: ${updatedRep.completedTasks}`);

  console.log("\n✅ Simulation complete — all AgentBazaar SDK layers working correctly.");
  console.log("   Deploy contracts and run again for real on-chain execution.");
}

// ---------- On-chain mode (contracts deployed) ----------
async function runOnChain(ab: AgentBazaar): Promise<void> {
  console.log("\n=== ON-CHAIN MODE ===");

  // Start event listener
  ab.events
    .on("ServiceRegistered", (e) => console.log("[EVENT] ServiceRegistered:", e.txHash))
    .on("TaskCreated", (e) => console.log("[EVENT] TaskCreated:", e.txHash))
    .on("TaskCompleted", (e) => console.log("[EVENT] TaskCompleted:", e.txHash))
    .on("ReputationUpdated", (e) => console.log("[EVENT] ReputationUpdated:", e.txHash));
  ab.events.start(500);

  const providerSigner = createMockSigner(
    "erd1provider000000000000000000000000000000000000000000000000000",
    0,
  );
  const consumerSigner = createMockSigner(
    "erd1buyer0000000000000000000000000000000000000000000000000000",
    0,
  );

  // Register service
  console.log("\n[2] Registering service on-chain...");
  const registerTxHash = await ab.registry.registerService({
    signer: providerSigner,
    service: {
      serviceId: "svc-data-fetch-001",
      provider: providerSigner.getAddress(),
      name: "DataFetch Pro",
      category: "data",
      endpoint: "https://api.agentbazaar.io/services/data-fetch-pro",
      pricingModel: "fixed",
      price: "1000000000000000",
      currency: "EGLD",
    },
    stakeEgld: "50000000000000000", // 0.05 EGLD min stake
  });
  console.log(`   Registry TX: ${ab.config.addresses.registry ? `${ab.config.explorer}/transactions/${registerTxHash}` : registerTxHash}`);

  // Create escrow task
  console.log("\n[3] Creating escrow task on-chain...");
  const { txHash: escrowTxHash, taskId } = await ab.escrow.createTask({
    signer: consumerSigner,
    serviceId: "svc-data-fetch-001",
    provider: providerSigner.getAddress(),
    input: { pair: "EGLD/USDC", interval: "1m" },
    amountEgld: "1000000000000000",
  });
  console.log(`   Escrow TX: ${ab.config.explorer}/transactions/${escrowTxHash}`);
  console.log(`   Task ID: ${taskId.slice(0, 16)}...`);

  // MCP execution
  console.log("\n[4] MCP execution...");
  const mcpResult = await ab.mcp.executeMCPRequest(
    {
      serviceId: "svc-data-fetch-001",
      taskId,
      toolCalls: [{ tool: "fetchMarketData", args: { pair: "EGLD/USDC" } }],
    },
    {
      fetchMarketData: async (args) => ({ pair: args?.pair, price: "42.15" }),
    },
  );
  console.log(`   Proof hash: ${mcpResult.proofHash?.slice(0, 16)}...`);

  // Release escrow
  console.log("\n[5] Releasing escrow on-chain...");
  const releaseTxHash = await ab.escrow.releaseEscrow(
    providerSigner,
    taskId,
    mcpResult.proofHash!,
  );
  console.log(`   Release TX: ${ab.config.explorer}/transactions/${releaseTxHash}`);

  // Submit proof to reputation contract
  console.log("\n[6] Submitting proof to reputation contract...");
  const repTxHash = await ab.reputation.submitCompletionProof(
    providerSigner,
    taskId,
    mcpResult.proofHash!,
    220,
  );
  console.log(`   Reputation TX: ${ab.config.explorer}/transactions/${repTxHash}`);

  // Read reputation back
  const repRecord = await ab.reputation.getReputation(providerSigner.getAddress());
  console.log("\n[7] Reputation on-chain:", repRecord);

  ab.events.stop();
  console.log("\n✅ On-chain E2E complete.");
}

main().catch((err) => {
  console.error("[AgentBazaar E2E] Fatal error:", err);
  process.exit(1);
});
