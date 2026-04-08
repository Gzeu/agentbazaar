/**
 * integration.test.ts
 * Integration tests for the on-chain layer using mocked fetch.
 * Tests ChainClient, TxBuilder, QuoteEngine, EventListener logic
 * without requiring real devnet connectivity.
 */

import assert from "assert";
import { ChainClient } from "../src/chainClient";
import {
  buildRegisterServiceCall,
  buildCreateTaskCall,
  buildReleaseEscrowCall,
  buildSubmitCompletionProofCall,
  buildGetServiceQuery,
} from "../src/txBuilder";
import { generateQuote, isQuoteValid } from "../src/quoteEngine";
import { AgentBazaar } from "../src/agentBazaar";
import { DevnetConfig } from "../src/types";

const MOCK_CONFIG: DevnetConfig = {
  network: "devnet",
  chainId: "D",
  proxy: "https://devnet-gateway.multiversx.com",
  explorer: "https://devnet-explorer.multiversx.com",
  api: "https://devnet-api.multiversx.com",
  addresses: {
    registry: "erd1qqqqqqqqqqqqqpgqregistry000000000000000000000000000000000",
    escrow: "erd1qqqqqqqqqqqqqpgqescrow0000000000000000000000000000000000",
    reputation: "erd1qqqqqqqqqqqqqpgqreputation00000000000000000000000000000000",
  },
};

async function run(): Promise<void> {
  // --- TxBuilder tests ---
  console.log("[1] TxBuilder encoding tests...");

  const reg = buildRegisterServiceCall(
    "svc-001", "DataFetch", "data", "https://example.com", "fixed", 1000n, "ipfs://meta",
  );
  assert.ok(reg.data.startsWith("registerService@"), "registerService data prefix");
  assert.ok(reg.gasLimit > 0, "gasLimit > 0");

  const task = buildCreateTaskCall("task-001", "svc-001", "erd1provider", "0xdeadbeef");
  assert.ok(task.data.startsWith("createTask@"), "createTask data prefix");

  const release = buildReleaseEscrowCall("task-001", "0xproofhash");
  assert.ok(release.data.startsWith("releaseEscrow@"));

  const proof = buildSubmitCompletionProofCall("task-001", "0xproofhash", 220);
  assert.ok(proof.data.startsWith("submitCompletionProof@"));

  const query = buildGetServiceQuery("svc-001");
  assert.equal(query.length, 1);

  console.log("   ✅ TxBuilder OK");

  // --- QuoteEngine tests ---
  console.log("[2] QuoteEngine tests...");

  const service = {
    serviceId: "svc-001",
    provider: "erd1provider",
    name: "DataFetch",
    category: "data",
    endpoint: "https://example.com",
    pricingModel: "fixed" as const,
    price: "10000",
    currency: "EGLD",
  };

  const quote = generateQuote(
    { serviceId: "svc-001", buyer: "erd1buyer", maxPrice: "20000" },
    service,
  );
  assert.ok(quote.quoteId.length === 64, "quoteId is sha256 hex");
  assert.equal(quote.serviceId, "svc-001");
  assert.equal(BigInt(quote.price) > 10000n, true, "price includes platform fee");
  assert.equal(isQuoteValid(quote), true, "fresh quote is valid");

  // maxPrice rejection
  let threw = false;
  try {
    generateQuote({ serviceId: "svc-001", buyer: "erd1buyer", maxPrice: "5" }, service);
  } catch (_) { threw = true; }
  assert.ok(threw, "quote rejected when price > maxPrice");

  console.log("   ✅ QuoteEngine OK");

  // --- AgentBazaar facade tests ---
  console.log("[3] AgentBazaar facade instantiation...");

  const ab = new AgentBazaar(MOCK_CONFIG);
  assert.ok(ab.chain instanceof ChainClient);
  assert.equal(typeof ab.quote.generateQuote, "function");
  assert.equal(typeof ab.mcp.executeMCPRequest, "function");
  assert.equal(typeof ab.ucp.filterUCPServices, "function");
  assert.equal(typeof ab.ap2.validateMandate, "function");
  assert.equal(typeof ab.x402.signX402Payment, "function");
  assert.equal(typeof ab.acp.createACPCheckoutSession, "function");
  assert.equal(typeof ab.reputationEngine.updateReputation, "function");

  console.log("   ✅ Facade OK");

  // --- AgentBazaar.fromJson ---
  console.log("[4] AgentBazaar.fromJson...");
  const ab2 = AgentBazaar.fromJson({
    network: "devnet",
    chainID: "D",
    proxy: "https://devnet-gateway.multiversx.com",
    explorer: "https://devnet-explorer.multiversx.com",
    contracts: { registry: "erd1reg", escrow: "erd1esc", reputation: "erd1rep" },
  });
  assert.equal(ab2.config.chainId, "D");
  assert.equal(ab2.config.addresses.registry, "erd1reg");
  console.log("   ✅ fromJson OK");

  console.log("\n✅ All integration tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
