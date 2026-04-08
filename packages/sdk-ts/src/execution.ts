import type { TaskRequest, TaskResult } from './types';

/**
 * AgentBazaar Execution Client
 * Handles MCP-compatible task submission and result polling
 */
export class ExecutionClient {
  constructor(private readonly orchestrationApiUrl: string) {}

  /**
   * Submit a task to a provider agent
   */
  async submitTask(request: TaskRequest): Promise<string> {
    throw new Error('Not implemented');
  }

  /**
   * Poll task status
   */
  async getTaskStatus(taskId: string): Promise<TaskResult> {
    throw new Error('Not implemented');
  }

  /**
   * Submit execution proof on-chain
   */
  async submitProof(taskId: string, resultHash: string, providerSignature: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
