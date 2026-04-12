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
  disputeReason?: string;
  latencyMs?: number;
  onChainVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  disputed: number;
  successRate: number;
  avgLatencyMs: number;
  onChainVerifiedRate: number;
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
    const now = Date.now();
    const demos: Partial<TaskRecord>[] = [
      {
        id: 'task-demo-001', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'completed', maxBudget: '1000000000000000',
        latencyMs: 187, onChainVerified: false,
        createdAt: new Date(now - 3600000).toISOString(),
        updatedAt: new Date(now - 3599000).toISOString(),
        deadline: new Date(now + 300000).toISOString(),
      },
      {
        id: 'task-demo-002', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'running', maxBudget: '5000000000000000',
        onChainVerified: false,
        createdAt: new Date(now - 120000).toISOString(),
        updatedAt: new Date(now - 60000).toISOString(),
        deadline: new Date(now + 180000).toISOString(),
      },
      {
        id: 'task-demo-003', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'pending', maxBudget: '500000000000000',
        onChainVerified: false,
        createdAt: new Date(now - 30000).toISOString(),
        updatedAt: new Date(now - 30000).toISOString(),
        deadline: new Date(now + 270000).toISOString(),
      },
    ];
    for (const d of demos) this.store.set(d.id!, d as TaskRecord);
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

  getMetrics(): TaskMetrics {
    const all = Array.from(this.store.values());
    const completed  = all.filter(t => t.status === 'completed');
    const failed     = all.filter(t => t.status === 'failed');
    const pending    = all.filter(t => t.status === 'pending');
    const running    = all.filter(t => t.status === 'running');
    const disputed   = all.filter(t => t.status === 'disputed');
    const withLatency = completed.filter(t => t.latencyMs !== undefined);
    const verified   = all.filter(t => t.onChainVerified);

    const total = all.length;
    const successRate = total > 0 ? (completed.length / total) * 100 : 0;
    const avgLatencyMs = withLatency.length > 0
      ? withLatency.reduce((s, t) => s + (t.latencyMs ?? 0), 0) / withLatency.length
      : 0;
    const onChainVerifiedRate = total > 0 ? (verified.length / total) * 100 : 0;

    return {
      total, completed: completed.length, failed: failed.length,
      pending: pending.length, running: running.length, disputed: disputed.length,
      successRate: Math.round(successRate * 100) / 100,
      avgLatencyMs: Math.round(avgLatencyMs),
      onChainVerifiedRate: Math.round(onChainVerifiedRate * 100) / 100,
    };
  }

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
      deadline:        String(body.deadline ?? new Date(Date.now() + 300_000).toISOString()),
    };
    this.store.set(id, record);
    this.logger.log(`Task created: ${id} — escrowTx: ${record.escrowTxHash ?? 'none'}`);

    this.executeTaskReal(record).catch(err =>
      this.logger.error(`executeTaskReal ${id} unhandled: ${(err as Error).message}`),
    );

    return record;
  }

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

  dispute(id: string, reason: string): TaskRecord {
    const task = this.findOne(id);
    if (task.status !== 'completed' && task.status !== 'failed') {
      task.status = 'disputed';
      task.disputeReason = reason;
      task.updatedAt = new Date().toISOString();
      this.store.set(id, task);
      this.logger.log(`Task disputed: ${id} — ${reason}`);
    }
    return task;
  }

  private async executeTaskReal(task: TaskRecord): Promise<void> {
    const start = Date.now();
    try {
      // ─ Step 1: x402 escrow verification ─────────────────
      const requireEscrow = this.config.get('X402_REQUIRE_ESCROW') === 'true';
      if (requireEscrow && task.escrowTxHash) {
        const valid = await this.contracts.verifyX402Payment(task.escrowTxHash, task.id);
        if (!valid) {
          this.logger.warn(`Task ${task.id}: escrow verification failed`);
          this.setStatus(task, 'failed');
          return;
        }
        task.onChainVerified = true;
      }

      // ─ Step 2: running ────────────────────────────────
      this.setStatus(task, 'running');

      // ─ Step 3: check escrow locked ──────────────────────
      if (this.contracts['mvx'].ESCROW_CONTRACT) {
        const escrowState = await this.contracts.getTaskEscrow(task.id);
        this.logger.debug(`Escrow state ${task.id}: ${JSON.stringify(escrowState)}`);
      }

      // ─ Step 4: call provider ────────────────────────────
      const providerResult = await this.callProviderEndpoint(task);

      // ─ Step 5: hash proof ──────────────────────────────
      const proofHash = this.contracts.hashResult(providerResult);
      const latencyMs = Date.now() - start;

      // ─ Step 6: completeTask on-chain ───────────────────
      if (this.contracts['mvx'].ESCROW_CONTRACT) {
        const callResult = await this.contracts.completeTask(task.id, proofHash, latencyMs);
        if (callResult.success) {
          this.logger.log(`Task ${task.id} → on-chain complete txHash=${callResult.txHash}`);
        } else {
          this.logger.warn(`Task ${task.id} on-chain complete failed: ${callResult.error}`);
        }
      }

      // ─ Step 7: update reputation ────────────────────────
      if (this.contracts['mvx'].REPUTATION_CONTRACT && task.providerAddress) {
        await this.contracts.updateReputation(task.providerAddress, true, latencyMs);
      }

      // ─ Step 8: finalize ────────────────────────────────
      task.status          = 'completed';
      task.proofHash       = proofHash;
      task.latencyMs       = latencyMs;
      task.updatedAt       = new Date().toISOString();
      this.store.set(task.id, task);
      this.logger.log(`Task ${task.id} ✅ ${latencyMs}ms | proof=${proofHash.slice(0, 16)}…`);
    } catch (err) {
      const latencyMs = Date.now() - start;
      this.logger.error(`Task ${task.id} ❌ ${(err as Error).message}`);
      if (this.contracts['mvx'].REPUTATION_CONTRACT && task.providerAddress) {
        await this.contracts.updateReputation(task.providerAddress, false, latencyMs).catch(() => {});
      }
      this.setStatus(task, 'failed');
    }
  }

  private async callProviderEndpoint(task: TaskRecord): Promise<unknown> {
    const baseUrl = this.config.get('API_BASE_URL', 'http://localhost:3001');
    const endpoint = `${baseUrl}/tasks/${task.id}/execute`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-AgentBazaar-TaskId': task.id,
    };
    if (task.escrowTxHash) {
      headers['X-Payment-TxHash'] = task.escrowTxHash;
      headers['X-Payment-Network'] = 'multiversx-devnet';
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ taskId: task.id, serviceId: task.serviceId, payloadHash: task.payloadHash }),
        signal: AbortSignal.timeout(30_000),
      });
      return res.ok ? res.json() : { status: res.status, message: await res.text() };
    } catch {
      return { taskId: task.id, executedAt: new Date().toISOString(), offline: true };
    }
  }

  private setStatus(task: TaskRecord, status: TaskRecord['status']) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    this.store.set(task.id, task);
  }
}
