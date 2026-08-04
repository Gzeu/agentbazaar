import assert from "assert";
import { createACPCheckoutSession, authorizeACPCheckout, captureACPCheckout } from "../src/acp";
import { validateMandate } from "../src/ap2";
import { createACPCheckoutSession as _noop } from "../src/acp";
import { executeMCPRequest } from "../src/mcp";
import { updateReputation } from "../src/reputation";
import { filterUCPServices } from "../src/ucp";
import { ConsumerAgentRunner } from "../src/consumerRunner";
import { ProviderAgentRunner } from "../src/providerRunner";
import { signX402Payment, verifyX402Receipt, captureX402Payment } from "../src/x402";
import { decodeReputationStruct, decodeServiceRecord } from "../src/index";

// ── Helpers to build binary fixtures ────────────────────────────────────────

function u64BE(n: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Number(n >> 32n), 0);
  buf.writeUInt32BE(Number(n & 0xffffffffn), 4);
  return buf;
}

function nestedBigUint(n: bigint): Buffer {
  if (n === 0n) {
    const lenBuf = Buffer.alloc(4);
    return lenBuf;
  }
  const hex = n.toString(16).padStart(n.toString(16).length % 2 === 0 ? n.toString(16).length : n.toString(16).length + 1, "0");
  const bytes = Buffer.from(hex, "hex");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(bytes.length, 0);
  return Buffer.concat([lenBuf, bytes]);
}

function nestedBytes(s: string): Buffer {
  const payload = Buffer.from(s, "utf8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(payload.length, 0);
  return Buffer.concat([lenBuf, payload]);
}

/** Build a 32-byte pubkey for a test address (all zeros except last byte). */
function testPubkey(lastByte: number): Buffer {
  const buf = Buffer.alloc(32);
  buf[31] = lastByte;
  return buf;
}

// ── Test: decodeReputationStruct ─────────────────────────────────────────────

function buildReputationBuffer(opts: {
  totalTasks: bigint;
  successfulTasks: bigint;
  failedTasks: bigint;
  disputes: bigint;
  score: bigint;
  stake: bigint;
  totalLatencyMs: bigint;
  lastUpdated: bigint;
}): string {
  const buf = Buffer.concat([
    u64BE(opts.totalTasks),
    u64BE(opts.successfulTasks),
    u64BE(opts.failedTasks),
    u64BE(opts.disputes),
    u64BE(opts.score),
    nestedBigUint(opts.stake),
    u64BE(opts.totalLatencyMs),
    u64BE(opts.lastUpdated),
  ]);
  return buf.toString("base64");
}

function testDecodeReputation(): void {
  const agent = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";

  // Normal case: 10 tasks, 8 successful, 2 failed, 1 dispute, score=75
  const base64 = buildReputationBuffer({
    totalTasks: 10n,
    successfulTasks: 8n,
    failedTasks: 2n,
    disputes: 1n,
    score: 75n,
    stake: 1_000_000_000_000_000_000n, // 1 EGLD in 10^18
    totalLatencyMs: 3000n, // avg 300ms
    lastUpdated: 1700000000n,
  });

  const rep = decodeReputationStruct(agent, base64);
  assert.equal(rep.agent, agent, "agent mismatch");
  assert.equal(rep.score, 75, "score mismatch");
  assert.equal(rep.totalTasks, 10, "totalTasks mismatch");
  assert.ok(Math.abs(rep.successRate - 0.8) < 1e-9, `successRate expected 0.8, got ${rep.successRate}`);
  assert.ok(Math.abs(rep.avgLatencyMs - 300) < 1e-9, `avgLatencyMs expected 300, got ${rep.avgLatencyMs}`);
  assert.equal(rep.disputes, 1, "disputes mismatch");
  assert.equal(rep.stakeEgld, "1000000000000000000", "stakeEgld mismatch");
  assert.equal(rep.lastUpdated, 1700000000, "lastUpdated mismatch");

  // Zero-tasks case: successRate and avgLatencyMs must be 0 (no division by zero)
  const base64Zero = buildReputationBuffer({
    totalTasks: 0n,
    successfulTasks: 0n,
    failedTasks: 0n,
    disputes: 0n,
    score: 50n,
    stake: 0n,
    totalLatencyMs: 0n,
    lastUpdated: 0n,
  });
  const repZero = decodeReputationStruct(agent, base64Zero);
  assert.equal(repZero.successRate, 0, "successRate should be 0 when totalTasks=0");
  assert.equal(repZero.avgLatencyMs, 0, "avgLatencyMs should be 0 when totalTasks=0");

  console.log("[test] decodeReputationStruct: PASS");
}

// ── Test: decodeServiceRecord ────────────────────────────────────────────────

function buildServiceRecordBuffer(): { base64: string; expectedProvider: Buffer } {
  const pubkey = testPubkey(0x01);
  const buf = Buffer.concat([
    pubkey,                              // provider Address (32 bytes)
    nestedBytes("My Service"),           // name
    nestedBytes("compute"),              // category
    nestedBytes("https://api.example.com/mcp"), // endpoint_url
    nestedBytes("fixed"),               // pricing_model
    nestedBigUint(500_000_000_000_000_000n), // price (0.5 EGLD)
    nestedBytes("ipfs://QmTest"),        // metadata_uri
    nestedBigUint(1_000_000_000_000_000_000n), // stake (1 EGLD)
    Buffer.from([0x01]),                 // active = true
    u64BE(1700000000n),                  // registered_at
  ]);
  return { base64: buf.toString("base64"), expectedProvider: pubkey };
}

function testDecodeServiceRecord(): void {
  const serviceId = "svc-test-001";
  const { base64 } = buildServiceRecordBuffer();

  const svc = decodeServiceRecord(serviceId, base64);
  assert.equal(svc.serviceId, serviceId, "serviceId mismatch");
  assert.equal(svc.name, "My Service", "name mismatch");
  assert.equal(svc.category, "compute", "category mismatch");
  assert.equal(svc.endpoint, "https://api.example.com/mcp", "endpoint mismatch");
  assert.equal(svc.pricePerCall, "500000000000000000", "pricePerCall mismatch");
  assert.equal(svc.metadataHash, "ipfs://QmTest", "metadataHash mismatch");
  assert.equal(svc.active, true, "active mismatch");
  assert.equal(svc.description, "", "description should be empty default");
  assert.equal(svc.maxLatencyMs, 0, "maxLatencyMs should be 0 default");
  // provider is a bech32 derived from a 32-byte pubkey (last byte 0x01)
  assert.ok(typeof svc.provider === "string" && svc.provider.startsWith("erd1"), `provider should be bech32, got ${svc.provider}`);

  console.log("[test] decodeServiceRecord: PASS");
}

async function run(): Promise<void> {
  void _noop;

  // ── ABI decode unit tests (no network) ──────────────────────────────────
  testDecodeReputation();
  testDecodeServiceRecord();

  // ── Existing tests ───────────────────────────────────────────────────────
  const receipt = signX402Payment(
    {
      resource: "svc:data-fetch",
      amount: "1000",
      currency: "USDC",
      payer: "erd1buyer",
      payee: "erd1provider",
    },
    "secret",
  );
  assert.equal(verifyX402Receipt(
    {
      resource: "svc:data-fetch",
      amount: "1000",
      currency: "USDC",
      payer: "erd1buyer",
      payee: "erd1provider",
    }, receipt, "secret"), true);
  const captured = await captureX402Payment(receipt);
  assert.equal(captured.status, "captured");

  const session = createACPCheckoutSession({
    buyer: "erd1buyer",
    provider: "erd1provider",
    amount: "2000",
    currency: "USDC",
  });
  assert.equal(captureACPCheckout(authorizeACPCheckout(session)).status, "captured");

  const mandateResult = validateMandate({
    mandate: {
      mandateId: "m1",
      owner: "erd1owner",
      delegate: "erd1agent",
      maxAmount: "5000",
      currency: "USDC",
      allowedCategories: ["data"],
      validFrom: Date.now() - 1000,
      validUntil: Date.now() + 1000,
      dailyLimit: "5000",
    },
    quote: {
      quoteId: "q1",
      serviceId: "svc1",
      provider: "erd1provider",
      price: "1000",
      currency: "USDC",
      expiresAt: Date.now() + 1000,
      settlementMethod: "x402",
    },
    category: "data",
    spentToday: "500",
  });
  assert.equal(mandateResult.valid, true);

  const mcp = await executeMCPRequest(
    {
      serviceId: "svc1",
      taskId: "task1",
      toolCalls: [{ tool: "fetchData", args: { key: "value" } }],
    },
    {
      fetchData: async (args) => ({ ok: true, echoed: args?.key }),
    },
  );
  assert.equal(mcp.success, true);
  assert.equal(mcp.outputs[0].echoed, "value");

  const reputation = updateReputation({
    record: {
      address: "erd1provider",
      score: 0,
      completedTasks: 10,
      failedTasks: 1,
      disputedTasks: 0,
      medianLatencyMs: 200,
      updatedAt: Date.now(),
    },
    succeeded: true,
    latencyMs: 180,
  });
  assert.ok(reputation.score >= 0);
  assert.equal(reputation.completedTasks, 11);

  const discovered = filterUCPServices(
    [
      {
        serviceId: "svc1",
        provider: "erd1provider",
        name: "Data Fetch Pro",
        category: "data",
        endpoint: "https://example.com",
        pricingModel: "fixed",
        price: "1000",
        currency: "USDC",
        tags: ["api", "json"],
        reputationScore: 90,
        active: true,
      },
    ],
    { category: "data", activeOnly: true, search: "fetch" },
  );
  assert.equal(discovered.length, 1);

  const consumer = new ConsumerAgentRunner({ buyerAddress: "erd1buyer" });
  const task = consumer.createTaskFromQuote(
    {
      quoteId: "q1",
      serviceId: "svc1",
      provider: "erd1provider",
      price: "1000",
      currency: "USDC",
      expiresAt: Date.now() + 1000,
      settlementMethod: "x402",
    },
    { query: "latest price" },
  );

  const provider = new ProviderAgentRunner({
    providerAddress: "erd1provider",
    service: {
      serviceId: "svc1",
      provider: "erd1provider",
      name: "Data Fetch Pro",
      category: "data",
      endpoint: "https://example.com",
      pricingModel: "fixed",
    },
    execute: async (incoming) => ({
      taskId: incoming.taskId!,
      status: "completed",
      output: { ok: true },
    }),
  });

  const result = await provider.handleTask(task);
  assert.equal(result.status, "completed");

  console.log("All SDK tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
