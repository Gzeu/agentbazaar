/**
 * agentBazaar.ts
 * AgentBazaar — unified facade for the full on-chain interaction flow.
 *
 * Usage:
 *   const ab = new AgentBazaar(config);
 *   const quote = ab.quote.generateQuote(request, service);
 *   const { txHash, taskId } = await ab.escrow.createTask({ signer, ... });
 *   const proof = await ab.mcp.execute(request, tools);
 *   await ab.escrow.releaseEscrow(signer, taskId, proof.proofHash!);
 *   await ab.reputation.submitCompletionProof(signer, taskId, proof.proofHash!, latencyMs);
 *   ab.events.on('TaskCompleted', handler);
 */

import { DevnetConfig } from "./types";
import { ChainClient } from "./chainClient";
import { OnChainRegistry } from "./onchainRegistry";
import { OnChainEscrow } from "./onchainEscrow";
import { OnChainReputation } from "./onchainReputation";
import { EventListener } from "./eventListener";
import { generateQuote, isQuoteValid } from "./quoteEngine";
import { executeMCPRequest } from "./mcp";
import { filterUCPServices } from "./ucp";
import { validateMandate } from "./ap2";
import { signX402Payment, verifyX402Receipt } from "./x402";
import { createACPCheckoutSession, authorizeACPCheckout, captureACPCheckout } from "./acp";
import { updateReputation, computeReputationScore } from "./reputation";
import { ProviderAgentRunner } from "./providerRunner";
import { ConsumerAgentRunner } from "./consumerRunner";

export class AgentBazaar {
  readonly chain: ChainClient;
  readonly registry: OnChainRegistry;
  readonly escrow: OnChainEscrow;
  readonly reputation: OnChainReputation;
  readonly events: EventListener;

  readonly quote = { generateQuote, isQuoteValid };
  readonly mcp = { executeMCPRequest };
  readonly ucp = { filterUCPServices };
  readonly ap2 = { validateMandate };
  readonly x402 = { signX402Payment, verifyX402Receipt };
  readonly acp = { createACPCheckoutSession, authorizeACPCheckout, captureACPCheckout };
  readonly reputationEngine = { updateReputation, computeReputationScore };
  readonly runners = { ProviderAgentRunner, ConsumerAgentRunner };

  constructor(public readonly config: DevnetConfig) {
    this.chain = new ChainClient(config);
    this.registry = new OnChainRegistry(config);
    this.escrow = new OnChainEscrow(config);
    this.reputation = new OnChainReputation(config);
    this.events = new EventListener(config);
  }

  static fromJson(json: Record<string, unknown>): AgentBazaar {
    const config: DevnetConfig = {
      network: (json["network"] as DevnetConfig["network"]) ?? "devnet",
      chainId: (json["chainID"] as string) ?? "D",
      proxy: json["proxy"] as string,
      explorer: json["explorer"] as string,
      api: json["api"] as string | undefined,
      addresses: (json["contracts"] as DevnetConfig["addresses"]) ?? {},
    };
    return new AgentBazaar(config);
  }
}
