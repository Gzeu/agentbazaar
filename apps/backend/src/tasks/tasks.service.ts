import { Injectable, NotFoundException, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ReputationService } from '../reputation/reputation.service';

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
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

export interface TaskMetrics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  disputed: number;
  successRate: number;
  avgLatencyMs: number;
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private store = new Map<string, TaskRecord>();

  constructor(
    @Inject(forwardRef(() => ReputationService))
    private readonly reputation: ReputationService,
  ) {}

  onModuleInit() {
    const now = Date.now();
    const provAddr = 'erd1qqqqqqqqqqqqqpgq5l62sgxdlhfyc7r27nsu2x0dkqln8vxtc0nsk8k0e6';
    const demos: Partial<TaskRecord>[] = [
      { id: 'task-demo-001', serviceId: 'svc-demo', consumerId: 'erd1consumer001', providerAddress: provAddr, status: 'completed', maxBudget: '1000000000000000', latencyMs: 187, createdAt: new Date(now - 3600000).toISOString(), updatedAt: new Date(now - 3599000).toISOString(), deadline: new Date(now + 300000).toISOString() },
      { id: 'task-demo-002', serviceId: 'svc-demo', consumerId: 'erd1consumer001', providerAddress: provAddr, status: 'running',   maxBudget: '5000000000000000', createdAt: new Date(now - 120000).toISOString(),  updatedAt: new Date(now - 60000).toISOString(),  deadline: new Date(now + 180000).toISOString() },
      { id: 'task-demo-003', serviceId: 'svc-demo', consumerId: 'erd1consumer002', providerAddress: provAddr, status: 'pending',   maxBudget: '500000000000000',  createdAt: new Date(now - 30000).toISOString(),   updatedAt: new Date(now - 30000).toISOString(),  deadline: new Date(now + 270000).toISOString() },
      { id: 'task-demo-004', serviceId: 'svc-wallet', consumerId: 'erd1consumer002', providerAddress: provAddr, status: 'failed', maxBudget: '2000000000000000', createdAt: new Date(now - 7200000).toISOString(), updatedAt: new Date(now - 7190000).toISOString(), deadline: new Date(now - 3600000).toISOString() },
    ];
    for (const d of demos) this.store.set(d.id!, d as TaskRecord);
    this.logger.log(`TasksService seeded ${this.store.size} demo tasks`);
  }

  findAll(opts: { limit: number; status?: string; consumerId?: string; providerAddress?: string }) {
    let list = Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (opts.status) list = list.filter(t => t.status === opts.status);
    if (opts.consumerId) list = list.filter(t => t.consumerId === opts.consumerId);
    if (opts.providerAddress) list = list.filter(t => t.providerAddress === opts.providerAddress);
    const sliced = list.slice(0, opts.limit);
    return { tasks: sliced, total: list.length };
  }

  findOne(id: string): TaskRecord {
    const t = this.store.get(id);
    if (!t) throw new NotFoundException(`Task ${id} not found`);
    return t;
  }

  getMetrics(): TaskMetrics {
    const all = Array.from(this.store.values());
    const completed = all.filter(t => t.status === 'completed');
    const latencies = completed.filter(t => t.latencyMs).map(t => t.latencyMs!);
    return {
      total: all.length,
      pending: all.filter(t => t.status === 'pending').length,
      running: all.filter(t => t.status === 'running').length,
      completed: completed.length,
      failed: all.filter(t => t.status === 'failed').length,
      disputed: all.filter(t => t.status === 'disputed').length,
      successRate: all.length ? Math.round((completed.length / all.length) * 100) : 0,
      avgLatencyMs: latencies.length
        ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
        : 0,
    };
  }

  create(body: Record<string, unknown>): TaskRecord {
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
      createdAt:       now,
      updatedAt:       now,
      deadline:        String(body.deadline ?? new Date(Date.now() + 300_000).toISOString()),
    };
    this.store.set(id, record);
    this.logger.log(`Task created: ${id}`);
    setTimeout(() => this.simulateExecution(id), 2000 + Math.random() * 3000);
    return record;
  }

  complete(id: string, proofHash: string, latencyMs: number): TaskRecord {
    const task = this.findOne(id);
    task.status    = 'completed';
    task.proofHash = proofHash;
    task.latencyMs = latencyMs;
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);
    this.reputation.recordTaskOutcome(task.providerAddress, true, latencyMs);
    this.logger.log(`Task completed: ${id} — ${latencyMs}ms`);
    return task;
  }

  private simulateExecution(id: string) {
    const task = this.store.get(id);
    if (!task || task.status !== 'pending') return;
    task.status    = 'running';
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);

    const latency = 100 + Math.floor(Math.random() * 400);
    setTimeout(() => {
      const t = this.store.get(id);
      if (!t) return;
      const success = Math.random() > 0.1;
      t.status    = success ? 'completed' : 'failed';
      t.latencyMs = success ? latency : undefined;
      t.proofHash = success ? `0x${uuidv4().replace(/-/g, '')}` : undefined;
      t.updatedAt = new Date().toISOString();
      this.store.set(id, t);
      this.reputation.recordTaskOutcome(t.providerAddress, success, latency);
      this.logger.log(`Task ${id} → ${t.status}${success ? ` (${latency}ms)` : ''}`);
    }, latency);
  }
}
