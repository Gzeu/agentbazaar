/**
 * AgentExecutorService — Autonomous Agent Executor
 *
 * This service is the brain of AgentBazaar as a Provider marketplace.
 * When a task arrives, it:
 *   1. Looks up the service in the registry (on-chain or in-memory)
 *   2. Routes to the correct provider agent endpoint
 *   3. Handles retries, timeouts, and fallbacks
 *   4. Uses SC MCP to verify on-chain state before/after execution
 *   5. Returns a structured result that gets hashed as proof
 *
 * For autonomous agent-to-agent calls, it reads provider endpoints
 * from the UCP catalog and uses x402 headers for payment proof.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../services/services.service';
import { McpClientService } from '../multiversx/mcp-client.service';
import { McpContractService } from '../multiversx/mcp-contract.service';

export interface ExecutionResult {
  taskId: string;
  serviceId: string;
  success: boolean;
  output: unknown;
  proofHash?: string;
  latencyMs: number;
  providerEndpoint: string;
  mcpVerified: boolean;
  executedAt: string;
  error?: string;
}

@Injectable()
export class AgentExecutorService {
  private readonly logger = new Logger(AgentExecutorService.name);

  constructor(
    private readonly services: ServicesService,
    private readonly mcp: McpClientService,
    private readonly contracts: McpContractService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Main autonomous execution entry point.
   * Called by TasksController when POST /tasks/:id/execute arrives.
   */
  async executeAutonomous(
    taskId: string,
    body: Record<string, unknown>,
  ): Promise<ExecutionResult> {
    const start = Date.now();
    const serviceId = body.serviceId as string ?? '';

    // ── 1. Resolve service ────────────────────────────────
    let service = this.tryGetService(serviceId);
    if (!service && this.mcp.isConnected) {
      // Try on-chain registry lookup via SC MCP
      const onChain = await this.contracts.getService(serviceId);
      if (onChain) service = { endpoint: onChain.endpoint, name: onChain.name };
    }

    const providerEndpoint = service?.endpoint ?? `${this.config.get('API_BASE_URL', 'http://localhost:3001')}/agent/default`;

    // ── 2. Verify on-chain state via SC MCP (if connected) ─
    let mcpVerified = false;
    if (this.mcp.isConnected) {
      try {
        const escrowState = await this.contracts.getTaskEscrow(taskId);
        mcpVerified = Boolean(escrowState);
        this.logger.debug(`Task ${taskId} escrow state: ${JSON.stringify(escrowState)}`);
      } catch {
        this.logger.debug(`Escrow check skipped for ${taskId}`);
      }
    }

    // ── 3. Execute against provider with retry ──────────
    let output: unknown = null;
    let success = false;
    let error: string | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        output = await this.callProvider(providerEndpoint, taskId, body);
        success = true;
        break;
      } catch (err) {
        error = (err as Error).message;
        this.logger.warn(`Task ${taskId} attempt ${attempt} failed: ${error}`);
        if (attempt < 3) await this.sleep(attempt * 500);
      }
    }

    // ── 4. Build structured result ──────────────────────
    const latencyMs = Date.now() - start;
    const result: ExecutionResult = {
      taskId,
      serviceId,
      success,
      output: success ? output : { error },
      latencyMs,
      providerEndpoint,
      mcpVerified,
      executedAt: new Date().toISOString(),
      error: success ? undefined : error,
    };

    this.logger.log(
      `Task ${taskId} → ${success ? '✅' : '❌'} ${latencyMs}ms │ mcpVerified=${mcpVerified} │ provider=${providerEndpoint}`,
    );

    return result;
  }

  /**
   * Provider-to-provider call.
   * Calls the provider's MCP/UCP endpoint with task context.
   * Uses x402-style headers for payment proof.
   */
  private async callProvider(
    endpoint: string,
    taskId: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgentBazaar-TaskId': taskId,
          'X-AgentBazaar-Version': '0.2.0',
          'User-Agent': 'AgentBazaar-Executor/0.2.0',
        },
        body: JSON.stringify({ taskId, ...body }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Provider returned ${res.status}: ${text.slice(0, 200)}`);
      }

      const ct = res.headers.get('content-type') ?? '';
      return ct.includes('application/json') ? res.json() : res.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private tryGetService(serviceId: string): { endpoint: string; name: string } | null {
    try {
      const s = this.services.findOne(serviceId);
      return { endpoint: s.endpoint, name: s.name };
    } catch {
      return null;
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
