import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateTaskDto } from './dto/create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed' | 'refunded';

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
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

/** Matches TASK_TIMEOUT in Escrow contract (1800s = 30 min) */
const TASK_TIMEOUT_MS = 1800 * 1000;

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private store = new Map<string, TaskRecord>();

  /**
   * Lazily injected to avoid circular NestJS dependency.
   * Call setDependencies() from AppModule.onModuleInit() after all modules are ready.
   */
  private reputationService?: {
    updateFromTask: (addr: string, success: boolean, latencyMs?: number) => void;
  };
  private servicesService?: {
    incrementTaskStats: (serviceId: string, success: boolean, latencyMs?: number) => void;
  };

  setDependencies(
    rep: { updateFromTask: (addr: string, success: boolean, latencyMs?: number) => void },
    svc: { incrementTaskStats: (serviceId: string, success: boolean, latencyMs?: number) => void },
  ) {
    this.reputationService = rep;
    this.servicesService = svc;
  }

  onModuleInit() {
    const now = Date.now();
    const demos: Partial<TaskRecord>[] = [
      {
        id: 'task-demo-001', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'completed', maxBudget: '1000000000000000',
        latencyMs: 187, proofHash: '0xabc123demo',
        createdAt: new Date(now - 3_600_000).toISOString(),
        updatedAt: new Date(now - 3_599_000).toISOString(),
        deadline:  new Date(now - 3_599_000 + TASK_TIMEOUT_MS).toISOString(),
      },
      {
        id: 'task-demo-002', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'running', maxBudget: '5000000000000000',
        createdAt: new Date(now - 120_000).toISOString(),
        updatedAt: new Date(now - 60_000).toISOString(),
        deadline:  new Date(now - 120_000 + TASK_TIMEOUT_MS).toISOString(),
      },
      {
        id: 'task-demo-003', serviceId: 'svc-demo',
        consumerId: 'erd1consumer', providerAddress: 'erd1provider',
        status: 'pending', maxBudget: '500000000000000',
        createdAt: new Date(now - 30_000).toISOString(),
        updatedAt: new Date(now - 30_000).toISOString(),
        deadline:  new Date(now - 30_000 + TASK_TIMEOUT_MS).toISOString(),
      },
    ];
    for (const d of demos) this.store.set(d.id!, d as TaskRecord);
    this.logger.log(`Seeded ${this.store.size} demo tasks`);
  }

  findAll(opts: { limit: number; status?: string; after?: string }) {
    let list = Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (opts.status) list = list.filter(t => t.status === opts.status);
    if (opts.after) {
      const idx = list.findIndex(t => t.id === opts.after);
      if (idx !== -1) list = list.slice(idx + 1);
    }
    const page = list.slice(0, opts.limit);
    return {
      data: page,
      total: list.length,
      nextCursor: page.length === opts.limit ? page[page.length - 1].id : null,
    };
  }

  findOne(id: string): TaskRecord {
    const t = this.store.get(id);
    if (!t) throw new NotFoundException(`Task ${id} not found`);
    return t;
  }

  create(dto: CreateTaskDto): TaskRecord {
    const id = dto.id ?? `task-${uuidv4().slice(0, 8)}`;
    if (this.store.has(id)) throw new Error(`Task ID ${id} already exists`);
    const now = new Date();
    const record: TaskRecord = {
      id,
      serviceId:       dto.serviceId,
      consumerId:      dto.consumerId,
      providerAddress: dto.providerAddress,
      status:          'pending',
      maxBudget:       dto.maxBudget,
      payloadHash:     dto.payloadHash,
      escrowTxHash:    dto.escrowTxHash,
      createdAt:       now.toISOString(),
      updatedAt:       now.toISOString(),
      deadline: dto.deadline ?? new Date(now.getTime() + TASK_TIMEOUT_MS).toISOString(),
    };
    this.store.set(id, record);
    this.logger.log(`Task created: ${id}`);
    setTimeout(() => this.simulateExecution(id), 2000 + Math.random() * 3000);
    return record;
  }

  complete(id: string, dto: CompleteTaskDto): TaskRecord {
    const task = this.findOne(id);
    if (task.status !== 'pending' && task.status !== 'running') {
      throw new Error(`Cannot complete task in status: ${task.status}`);
    }
    task.status    = 'completed';
    task.proofHash = dto.proofHash;
    task.latencyMs = dto.latencyMs;
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);

    // Wire cross-service stats after real completion
    this.reputationService?.updateFromTask(task.providerAddress, true, dto.latencyMs);
    this.servicesService?.incrementTaskStats(task.serviceId, true, dto.latencyMs);

    this.logger.log(`Task completed: ${id} — ${dto.latencyMs}ms`);
    return task;
  }

  dispute(id: string, reason: string): TaskRecord {
    const task = this.findOne(id);
    if (!['pending', 'running', 'completed'].includes(task.status)) {
      throw new Error(`Cannot dispute task in status: ${task.status}`);
    }
    task.status        = 'disputed';
    task.disputeReason = reason;
    task.updatedAt     = new Date().toISOString();
    this.store.set(id, task);
    this.logger.log(`Task disputed: ${id} — ${reason}`);
    return task;
  }

  refund(id: string): TaskRecord {
    const task = this.findOne(id);
    if (task.status !== 'pending') {
      throw new Error(`Cannot refund task in status: ${task.status}`);
    }
    if (Date.now() < new Date(task.deadline).getTime()) {
      throw new Error(`Task deadline not reached yet (30 min timeout)`);
    }
    task.status    = 'refunded';
    task.updatedAt = new Date().toISOString();
    this.store.set(id, task);

    // Provider failed to deliver — penalise reputation
    this.reputationService?.updateFromTask(task.providerAddress, false);
    this.servicesService?.incrementTaskStats(task.serviceId, false);

    this.logger.log(`Task refunded: ${id}`);
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
      if (!t || t.status !== 'running') return;
      const success = Math.random() > 0.1;
      t.status    = success ? 'completed' : 'failed';
      t.latencyMs = success ? latency : undefined;
      t.proofHash = success ? `0x${uuidv4().replace(/-/g, '')}` : undefined;
      t.updatedAt = new Date().toISOString();
      this.store.set(id, t);

      // Wire stats for simulated execution too
      this.reputationService?.updateFromTask(t.providerAddress, success, t.latencyMs);
      this.servicesService?.incrementTaskStats(t.serviceId, success, t.latencyMs);

      this.logger.log(`Task ${id} → ${t.status}${success ? ` (${latency}ms)` : ''}`);
    }, latency);
  }
}
