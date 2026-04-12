import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed' | 'refunded';

export interface TaskRecord {
  id:              string;
  serviceId:       string;
  consumerId:      string;
  providerAddress: string;
  status:          TaskStatus;
  maxBudget:       string;
  payloadHash?:    string;
  proofHash?:      string;
  escrowTxHash?:   string;
  latencyMs?:      number;
  createdAt:       string;
  updatedAt:       string;
  deadline:        string;
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private store = new Map<string, TaskRecord>();

  onModuleInit() {
    const now = Date.now();
    const demos: Partial<TaskRecord>[] = [
      {
        id: 'task-demo-001', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'completed', maxBudget: '1000000000000000', latencyMs: 187,
        createdAt: new Date(now - 3_600_000).toISOString(),
        updatedAt: new Date(now - 3_599_000).toISOString(),
        deadline:  new Date(now +   300_000).toISOString(),
      },
      {
        id: 'task-demo-002', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'running', maxBudget: '5000000000000000',
        createdAt: new Date(now -   120_000).toISOString(),
        updatedAt: new Date(now -    60_000).toISOString(),
        deadline:  new Date(now +   180_000).toISOString(),
      },
      {
        id: 'task-demo-003', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'pending', maxBudget: '500000000000000',
        createdAt: new Date(now -    30_000).toISOString(),
        updatedAt: new Date(now -    30_000).toISOString(),
        deadline:  new Date(now +   270_000).toISOString(),
      },
    ];
    for (const d of demos) this.store.set(d.id!, d as TaskRecord);
    this.logger.log(`Seeded ${this.store.size} demo tasks`);
  }

  /** Canonical shape: { tasks, total } */
  findAll(opts: { limit: number; status?: string }) {
    let list = Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (opts.status) list = list.filter(t => t.status === opts.status);
    return { tasks: list.slice(0, opts.limit), total: list.length };
  }

  findOne(id: string): TaskRecord {
    const t = this.store.get(id);
    if (!t) throw new NotFoundException(`Task ${id} not found`);
    return t;
  }

  create(body: Record<string, unknown>): TaskRecord {
    const id  = String(body.id ?? `task-${uuidv4().slice(0, 8)}`);
    const now = new Date().toISOString();
    const record: TaskRecord = {
      id,
      serviceId:       String(body.serviceId ?? ''),
      consumerId:      String(body.consumerId ?? ''),
      providerAddress: String(body.providerAddress ?? ''),
      status:          'pending',
      maxBudget:       String(body.maxBudget ?? '0'),
      payloadHash:     body.payloadHash  as string | undefined,
      escrowTxHash:    body.escrowTxHash as string | undefined,
      createdAt:       now,
      updatedAt:       now,
      deadline:        String(body.deadline ?? new Date(Date.now() + 300_000).toISOString()),
    };
    this.store.set(id, record);
    this.logger.log(`Task created: ${id}`);
    setTimeout(() => this._simulateExecution(id), 2000 + Math.random() * 3000);
    return record;
  }

  complete(id: string, proofHash: string, latencyMs: number): TaskRecord {
    const task     = this.findOne(id);
    task.status    = 'completed';
    task.proofHash = proofHash;
    task.latencyMs = latencyMs;
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);
    this.logger.log(`Task completed: ${id} — ${latencyMs}ms`);
    return task;
  }

  /** Mark a task as refunded (deadline exceeded) */
  timeout(id: string): TaskRecord {
    const task     = this.findOne(id);
    task.status    = 'refunded';
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);
    this.logger.warn(`Task timed out → refunded: ${id}`);
    return task;
  }

  private _simulateExecution(id: string) {
    const task = this.store.get(id);
    if (!task || task.status !== 'pending') return;
    task.status    = 'running';
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);

    const latency = 100 + Math.floor(Math.random() * 400);
    setTimeout(() => {
      const t = this.store.get(id);
      if (!t) return;
      const success  = Math.random() > 0.1;
      t.status    = success ? 'completed' : 'failed';
      t.latencyMs = success ? latency : undefined;
      t.proofHash = success ? `0x${uuidv4().replace(/-/g, '')}` : undefined;
      t.updatedAt = new Date().toISOString();
      this.store.set(id, t);
      this.logger.log(`Task ${id} → ${t.status}${success ? ` (${latency}ms)` : ''}`);
    }, latency);
  }
}
