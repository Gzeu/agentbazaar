import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SubmitTaskDto, SubmitProofDto } from './dto/task.dto';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'disputed';

export interface TaskRecord {
  id: string;
  serviceId: string;
  consumerId: string;
  providerAddress: string;
  payload: Record<string, unknown>;
  maxBudget: string;
  status: TaskStatus;
  proofHash?: string;
  result?: Record<string, unknown>;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private readonly tasks = new Map<string, TaskRecord>();

  async submitTask(dto: SubmitTaskDto): Promise<TaskRecord> {
    const id = uuidv4();
    const deadlineSecs = dto.deadlineSeconds || 300; // default 5 min

    const task: TaskRecord = {
      id,
      serviceId: dto.serviceId,
      consumerId: dto.consumerId,
      providerAddress: dto.providerAddress,
      payload: dto.payload,
      maxBudget: dto.maxBudget,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + deadlineSecs * 1000).toISOString(),
    };

    this.tasks.set(id, task);
    this.logger.log(`Task submitted: ${id} for service ${dto.serviceId}`);

    // Simulate async dispatch to provider MCP endpoint
    // In production: POST to service.endpoint with MCP payload
    setTimeout(() => this.simulateExecution(id), 100);

    return task;
  }

  private simulateExecution(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'running';
    task.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, task);
  }

  async getTask(taskId: string): Promise<TaskRecord> {
    const task = this.tasks.get(taskId);
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  async submitProof(taskId: string, dto: SubmitProofDto): Promise<TaskRecord> {
    const task = await this.getTask(taskId);
    task.status = 'completed';
    task.proofHash = dto.proofHash;
    task.result = dto.result;
    task.latencyMs = dto.latencyMs;
    task.updatedAt = new Date().toISOString();
    this.tasks.set(taskId, task);

    this.logger.log(`Proof submitted for task ${taskId}: ${dto.proofHash}`);
    // TODO: Call escrow.releaseEscrow + reputation.recordOutcome on-chain

    return task;
  }

  async getTasksByConsumer(address: string): Promise<TaskRecord[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.consumerId === address,
    );
  }

  async getTasksByProvider(address: string): Promise<TaskRecord[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.providerAddress === address,
    );
  }
}
