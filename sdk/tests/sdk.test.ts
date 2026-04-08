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

async function run(): Promise<void> {
  void _noop;

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
