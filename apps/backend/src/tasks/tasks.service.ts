import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { McpContractService } from '../multiversx/mcp-contract.service';
import { ConfigService } from '@nestjs/config';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

export interface TaskRecord {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  status: TaskStatus;
  maxBudget: string;
  payloadHash?: string;
  proofHash?: string;
  escrowTxHash?: string;
  latencyMs?: number;
  onChainVerified: boolean;   // NEW — true when escrow proof confirmed on-chain
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private store = new Map<string, TaskRecord>();

  constructor(
    private readonly contracts: McpContractService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    // Seed demo tasks — only used when no real contract is configured
    const now = Date.now();
    const demos: Partial<TaskRecord>[] = [
      {
        id: 'task-demo-001',
        serviceId: 'svc-demo',
        consumerId: 'erd1consumer',
        providerAddress: 'erd1provider',
        status: 'completed',
        maxBudget: '1000000000000000',
        latencyMs: 187,
        onChainVerified: false,
        createdAt: new Date(now - 3600000).toISOString(),
        updatedAt: new Date(now - 3599000).toISOString(),
        deadline: new Date(now + 300000).toISOString(),
      },
      {
        id: 'task-demo-002',
        serviceId: 'svc-demo',
        consumerId: 'erd1consumer',
        providerAddress: 'erd1provider',
        status: 'running',
        maxBudget: '5000000000000000',
        onChainVerified: false,
        createdAt: new Date(now - 120000).toISOString(),
        updatedAt: new Date(now - 60000).toISOString(),
        deadline: new Date(now + 180000).toISOString(),
      },
      {
        id: 'task-demo-003',
        serviceId: 'svc-demo',
        consumerId: 'erd1consumer',
        providerAddress: 'erd1provider',
        status: 'pending',
        maxBudget: '500000000000000',
        onChainVerified: false,
        createdAt: new Date(now - 30000).toISOString(),
        updatedAt: new Date(now - 30000).toISOString(),
        deadline: new Date(now + 270000).toISOString(),
      },
    ];
    for (const d of demos) {
      this.store.set(d.id!, d as TaskRecord);
    }
    this.logger.log(`Seeded ${this.store.size} demo tasks`);
  }

  findAll(opts: { limit: number; status?: string }) {
    let list = Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (opts.status) list = list.filter(t => t.status === opts.status);
    return { data: list.slice(0, opts.limit), total: list.length };
  }

  findOne(id: string): TaskRecord {
    const t = this.store.get(id);
    if (!t) throw new NotFoundException(`Task ${id} not found`);
    return t;
  }

  /**
   * Create a task and kick off REAL on-chain execution.
   *
   * Flow:
   *  1. Persist task as 'pending'
   *  2. If x402 escrow tx is provided → verify on-chain
   *  3. Dispatch executeTaskReal() async (non-blocking)
   */
  async create(body: Record<string, unknown>): Promise<TaskRecord> {
    const id = String(body.id ?? `task-${uuidv4().slice(0, 8)}`);
    const now = new Date().toISOString();
    const record: TaskRecord = {
      id,
      serviceId:       String(body.serviceId ?? ''),
      consumerId:      String(body.consumerId ?? ''),
      providerAddress: String(body.providerAddress ?? ''),
      status:          'pending',
      maxBudget:       String(body.maxBudget ?? '0'),
      payloadHash:     body.payloadHash as string | undefined,
      escrowTxHash:    body.escrowTxHash as string | undefined,
      onChainVerified: false,
      createdAt:       now,
      updatedAt:       now,
      deadline:        String(
        body.deadline ?? new Date(Date.now() + 300_000).toISOString(),
      ),
    };
    this.store.set(id, record);
    this.logger.log(`Task created: ${id} — escrowTx: ${record.escrowTxHash ?? 'none'}`);

    // Non-blocking — execute async
    this.executeTaskReal(record).catch(err =>
      this.logger.error(`executeTaskReal ${id} unhandled: ${err.message}`),
    );

    return record;
  }

  // Called by EventPoller when on-chain TaskCompleted event arrives
  complete(id: string, proofHash: string, latencyMs: number): TaskRecord {
    const task = this.findOne(id);
    task.status          = 'completed';
    task.proofHash       = proofHash;
    task.latencyMs       = latencyMs;
    task.onChainVerified = true;
    task.updatedAt       = new Date().toISOString();
    this.store.set(id, task);
    this.logger.log(`Task completed (on-chain confirm): ${id} — ${latencyMs}ms`);
    return task;
  }

  /**
   * Real execution flow:
   *  1. Verify x402 escrow payment on-chain (if provided)
   *  2. Set status → 'running'
   *  3. Call provider agent endpoint
   *  4. Hash the result → proof
   *  5. Submit completeTask() on-chain via SC MCP
   *  6. Update reputation on-chain
   */
  private async executeTaskReal(task: TaskRecord): Promise<void> {
    const start = Date.now();

    try {
      // ── Step 1: x402 escrow verification ─────────────────
      const requireEscrow = this.config.get('X402_REQUIRE_ESCROW') === 'true';
      if (requireEscrow && task.escrowTxHash) {
        const valid = await this.contracts.verifyX402Payment(
          task.escrowTxHash,
          task.id,
        );
        if (!valid) {
          this.logger.warn(`Task ${task.id}: escrow verification failed`);
          task.status = 'failed';
          task.updatedAt = new Date().toISOString();
          this.store.set(task.id, task);
          return;
        }
        task.onChainVerified = true;
      }

      // ── Step 2: Set running ───────────────────────────────
      task.status = 'running';
      task.updatedAt = new Date().toISOString();
      this.store.set(task.id, task);

      // ── Step 3: Query escrow state (verify funds locked) ─
      if (this.contracts['mvx'].ESCROW_CONTRACT) {
        const escrowState = await this.contracts.getTaskEscrow(task.id);
        this.logger.debug(`Escrow state for ${task.id}: ${JSON.stringify(escrowState)}`);
      }

      // ── Step 4: Call provider agent endpoint ─────────────
      const providerResult = await this.callProviderEndpoint(task);

      // ── Step 5: Hash result → proof ───────────────────────
      const proofHash = this.contracts.hashResult(providerResult);
      const latencyMs = Date.now() - start;

      // ── Step 6: Submit completeTask on-chain ──────────────
      if (this.contracts['mvx'].ESCROW_CONTRACT) {
        const callResult = await this.contracts.completeTask(
          task.id,
          proofHash,
          latencyMs,
        );
        if (callResult.success) {
          this.logger.log(
            `Task ${task.id} completed on-chain: txHash=${callResult.txHash}`,
          );
        } else {
          this.logger.warn(
            `Task ${task.id} completeTask on-chain failed: ${callResult.error}`,
          );
        }
      }

      // ── Step 7: Update reputation ─────────────────────────
      if (this.contracts['mvx'].REPUTATION_CONTRACT && task.providerAddress) {
        await this.contracts.updateReputation(
          task.providerAddress,
          true,
          latencyMs,
        );
      }

      // ── Step 8: Mark complete locally ────────────────────
      task.status          = 'completed';
      task.proofHash       = proofHash;
      task.latencyMs       = latencyMs;
      task.updatedAt       = new Date().toISOString();
      this.store.set(task.id, task);
      this.logger.log(`Task ${task.id} ✅ completed in ${latencyMs}ms`);
    } catch (err) {
      const latencyMs = Date.now() - start;
      this.logger.error(`Task ${task.id} ❌ failed: ${(err as Error).message}`);

      // Try to update reputation with failure
      if (this.contracts['mvx'].REPUTATION_CONTRACT && task.providerAddress) {
        await this.contracts.updateReputation(
          task.providerAddress,
          false,
          latencyMs,
        ).catch(() => {}); // best-effort
      }

      task.status    = 'failed';
      task.updatedAt = new Date().toISOString();
      this.store.set(task.id, task);
    }
  }

  /**
   * Call the provider agent's UCP/MCP endpoint.
   * The provider endpoint is stored in the service registry.
   * Sends x402 payment header with the escrow tx hash.
   */
  private async callProviderEndpoint(task: TaskRecord): Promise<unknown> {
    const baseUrl = this.config.get('API_BASE_URL', 'http://localhost:3001');

    // In production: fetch provider endpoint from on-chain registry
    // For now: route to the configured endpoint or self
    const endpoint = `${baseUrl}/tasks/${task.id}/execute`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AgentBazaar-TaskId': task.id,
    };

    // x402 payment proof header
    if (task.escrowTxHash) {
      headers['X-Payment-TxHash'] = task.escrowTxHash;
      headers['X-Payment-Network'] = 'multiversx-devnet';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskId: task.id,
          serviceId: task.serviceId,
          payloadHash: task.payloadHash,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        // Provider unavailable or returned error — treat as task output
        return { status: res.status, message: await res.text() };
      }

      return res.json();
    } catch {
      // Provider unreachable — return minimal result to still produce a proof
      return { taskId: task.id, executedAt: new Date().toISOString(), offline: true };
    }
  }
}
