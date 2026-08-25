/**
 * McpContractService — High-level wrapper over McpClientService
 * specific to AgentBazaar's three contracts: Registry, Escrow, Reputation.
 *
 * Falls back to direct SDK queries (via MultiversxService) when MCP
 * is not available, so the app always works even without the MCP binary.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpClientService, McpCallResult } from './mcp-client.service';
import { MultiversxService } from './multiversx.service';
import { createHash } from 'crypto';

export interface OnChainService {
  id: string;
  name: string;
  providerAddress: string;
  endpoint: string;
  priceAmount: string;
  priceToken: string;
  reputationScore: number;
  totalTasks: number;
  active: boolean;
}

export interface OnChainTask {
  id: string;
  serviceId: string;
  consumer: string;
  provider: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'disputed';
  budget: string;
  escrowTxHash?: string;
  proofHash?: string;
  createdAt: number;
}

@Injectable()
export class McpContractService {
  private readonly logger = new Logger(McpContractService.name);

  constructor(
    private readonly mcp: McpClientService,
    private readonly mvx: MultiversxService,
    private readonly config: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════
  // REGISTRY CONTRACT
  // ═══════════════════════════════════════════════

  async getAllServices(): Promise<OnChainService[]> {
    const addr = this.mvx.REGISTRY_CONTRACT;
    if (!addr) return [];

    if (this.mcp.isConnected) {
      const result = await this.mcp.queryContract(addr, 'getAllServices', []);
      if (result.success && Array.isArray(result.data)) {
        return result.data as OnChainService[];
      }
    }
    // Fallback: direct SDK query
    const raw = await this.mvx.queryContract(addr, 'getAllServices', []);
    return this.parseServicesFromVmValues(raw);
  }

  async getService(serviceId: string): Promise<OnChainService | null> {
    const addr = this.mvx.REGISTRY_CONTRACT;
    if (!addr) return null;

    if (this.mcp.isConnected) {
      const result = await this.mcp.queryContract(addr, 'getService', [serviceId]);
      if (result.success && result.data) return result.data as OnChainService;
    }
    const raw = await this.mvx.queryContract(addr, 'getService', [serviceId]);
    return raw ? (raw as OnChainService) : null;
  }

  async registerService(
    name: string,
    endpoint: string,
    priceAmount: string,
    priceToken = 'EGLD',
  ): Promise<McpCallResult> {
    const addr = this.mvx.REGISTRY_CONTRACT;
    if (!addr) return { success: false, error: 'Registry contract not configured' };

    // Simulate first to check gas
    const sim = await this.mcp.simulate(addr, 'registerService', [
      Buffer.from(name).toString('hex'),
      Buffer.from(endpoint).toString('hex'),
      Buffer.from(priceAmount).toString('hex'),
      Buffer.from(priceToken).toString('hex'),
    ]);
    this.logger.debug(`Register simulate: ${JSON.stringify(sim.data)}`);

    return this.mcp.callContract(addr, 'registerService', [
      Buffer.from(name).toString('hex'),
      Buffer.from(endpoint).toString('hex'),
      Buffer.from(priceAmount).toString('hex'),
      Buffer.from(priceToken).toString('hex'),
    ]);
  }

  // ═══════════════════════════════════════════════
  // ESCROW CONTRACT
  // ═══════════════════════════════════════════════

  async getTaskEscrow(taskId: string) {
    const addr = this.mvx.ESCROW_CONTRACT;
    if (!addr) return null;

    if (this.mcp.isConnected) {
      const result = await this.mcp.queryContract(addr, 'getTaskEscrow', [taskId]);
      if (result.success) return result.data;
    }
    return this.mvx.queryContract(addr, 'getTaskEscrow', [taskId]);
  }

  async createTaskEscrow(
    taskId: string,
    providerAddress: string,
    budgetEgld: string,
  ): Promise<McpCallResult> {
    const addr = this.mvx.ESCROW_CONTRACT;
    if (!addr) return { success: false, error: 'Escrow contract not configured' };

    return this.mcp.callContract(
      addr,
      'createTask',
      [
        Buffer.from(taskId).toString('hex'),
        providerAddress,
      ],
      budgetEgld,
      15_000_000,
    );
  }

  async completeTask(
    taskId: string,
    proofHash: string,
    latencyMs: number,
  ): Promise<McpCallResult> {
    const addr = this.mvx.ESCROW_CONTRACT;
    if (!addr) return { success: false, error: 'Escrow contract not configured' };

    return this.mcp.callContract(addr, 'completeTask', [
      Buffer.from(taskId).toString('hex'),
      Buffer.from(proofHash).toString('hex'),
      latencyMs.toString(16).padStart(8, '0'),
    ]);
  }

  async refundTask(taskId: string): Promise<McpCallResult> {
    const addr = this.mvx.ESCROW_CONTRACT;
    if (!addr) return { success: false, error: 'Escrow contract not configured' };

    return this.mcp.callContract(addr, 'refundTask', [
      Buffer.from(taskId).toString('hex'),
    ]);
  }

  // Verify a submitted x402 payment proof (escrow tx)
  async verifyX402Payment(txHash: string, expectedTaskId: string): Promise<boolean> {
    if (!this.mcp.isConnected) {
      this.logger.warn('MCP not connected — skipping x402 escrow verification');
      return true; // Fail-open in dev; flip to false in production
    }
    const decoded = await this.mcp.decodeTx(txHash);
    if (!decoded.success || !decoded.data) return false;

    const tx = decoded.data as Record<string, unknown>;
    // Check tx called createTask with matching taskId
    const func = tx['function'] as string | undefined;
    const args = tx['args'] as string[] | undefined;
    if (func !== 'createTask') return false;
    if (!args || args.length < 1) return false;
    const decodedTaskId = Buffer.from(args[0], 'hex').toString('utf8');
    return decodedTaskId === expectedTaskId;
  }

  // ═══════════════════════════════════════════════
  // REPUTATION CONTRACT
  // ═══════════════════════════════════════════════

  async getReputation(address: string): Promise<number> {
    const addr = this.mvx.REPUTATION_CONTRACT;
    if (!addr) return 0;

    if (this.mcp.isConnected) {
      const result = await this.mcp.queryContract(addr, 'getScore', [address]);
      if (result.success && typeof result.data === 'number') return result.data;
    }
    const raw = await this.mvx.queryContract(addr, 'getScore', [address]);
    return typeof raw === 'number' ? raw : 0;
  }

  async updateReputation(
    agentAddress: string,
    taskSuccess: boolean,
    latencyMs: number,
  ): Promise<McpCallResult> {
    const addr = this.mvx.REPUTATION_CONTRACT;
    if (!addr) return { success: false, error: 'Reputation contract not configured' };

    return this.mcp.callContract(addr, 'recordTaskOutcome', [
      agentAddress,
      taskSuccess ? '01' : '00',
      latencyMs.toString(16).padStart(8, '0'),
    ]);
  }

  // ─── Utility ──────────────────────────────────
  hashResult(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(str).digest('hex');
  }

  private parseServicesFromVmValues(raw: unknown): OnChainService[] {
    if (!raw || !Array.isArray((raw as any).returnData)) return [];
    // Minimal decode — actual decode is ABI-driven when MCP is present
    return (raw as any).returnData
      .filter(Boolean)
      .map((b64: string, i: number) => ({
        id: `svc-onchain-${i}`,
        name: Buffer.from(b64, 'base64').toString('utf8').replace(/[^\x20-\x7E]/g, ''),
        providerAddress: '',
        endpoint: '',
        priceAmount: '0',
        priceToken: 'EGLD',
        reputationScore: 0,
        totalTasks: 0,
        active: true,
      }));
  }
}
