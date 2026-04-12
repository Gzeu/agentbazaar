import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs';

export interface McpQueryResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export interface McpCallResult {
  success: boolean;
  txHash?: string;
  data?: unknown;
  error?: string;
}

@Injectable()
export class McpClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpClientService.name);
  private client: Client | null = null;
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    // Verify multiversx-sc-mcp is installed
    const mcpBin = this.resolveMcpBin();
    if (!mcpBin) {
      this.logger.warn(
        'multiversx-sc-mcp not found in node_modules. ' +
        'Run: npm install github:psorinionut/multiversx-sc-mcp. ' +
        'Falling back to direct SDK queries.',
      );
      return;
    }

    const pemPath = this.config.get<string>('MVX_WALLET_PEM_PATH', './wallet/backend.pem');
    const pemContent = this.config.get<string>('MVX_WALLET_PEM_CONTENT', '');

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      MVX_NETWORK: this.config.get('MVX_NETWORK', 'devnet'),
      MVX_CHAIN_ID: this.config.get('MVX_CHAIN_ID', 'D'),
      MVX_API_URL: this.config.get('MVX_API_URL', 'https://devnet-api.multiversx.com'),
    };

    if (pemContent) {
      env['MVX_WALLET_PEM_CONTENT'] = pemContent;
    } else if (pemPath && fs.existsSync(pemPath)) {
      env['MVX_WALLET_PEM_PATH'] = path.resolve(pemPath);
    }

    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: [mcpBin],
        env,
      });

      this.client = new Client({
        name: 'agentbazaar-backend',
        version: '0.2.0',
      });

      await this.client.connect(transport);
      this.connected = true;
      this.logger.log('✅ MultiversX SC MCP client connected');

      // Log available tools
      const { tools } = await this.client.listTools();
      this.logger.log(`MCP tools available: ${tools.map(t => t.name).join(', ')}`);
    } catch (err) {
      this.logger.error(`SC MCP connection failed: ${(err as Error).message}`);
      this.logger.warn('Falling back to direct SDK queries');
      this.connected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.connected) {
      await this.client.close();
      this.logger.log('SC MCP client disconnected');
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }

  // ─── ABI ────────────────────────────────────────────────
  async getAbi(contractAddress: string): Promise<McpQueryResult> {
    return this.callTool('mvx_sc_abi', { contractAddress });
  }

  // ─── QUERY (read-only, no gas) ───────────────────────────
  async queryContract(
    contractAddress: string,
    funcName: string,
    args: string[] = [],
  ): Promise<McpQueryResult> {
    return this.callTool('mvx_sc_query', { contractAddress, funcName, args });
  }

  // ─── CALL (write, requires PEM, explicit confirm) ────────
  async callContract(
    contractAddress: string,
    funcName: string,
    args: string[] = [],
    value = '0',
    gasLimit = 10_000_000,
  ): Promise<McpCallResult> {
    const result = await this.callTool('mvx_sc_call', {
      contractAddress,
      funcName,
      args,
      value,
      gasLimit,
      confirmWrite: true, // Safety rail — explicit confirmation always
    });
    return {
      success: result.success,
      txHash: (result.data as any)?.txHash,
      data: result.data,
      error: result.error,
    };
  }

  // ─── STORAGE INSPECTION ──────────────────────────────────
  async inspectStorage(contractAddress: string, key: string): Promise<McpQueryResult> {
    return this.callTool('mvx_sc_storage', { contractAddress, key });
  }

  // ─── TOKEN INFO ──────────────────────────────────────────
  async getTokenInfo(identifier: string): Promise<McpQueryResult> {
    return this.callTool('mvx_token_info', { identifier });
  }

  // ─── TX DECODE ───────────────────────────────────────────
  async decodeTx(txHash: string): Promise<McpQueryResult> {
    return this.callTool('mvx_tx_decode', { txHash });
  }

  // ─── SEARCH ──────────────────────────────────────────────
  async search(query: string): Promise<McpQueryResult> {
    return this.callTool('mvx_search', { query });
  }

  // ─── SIMULATE TX ─────────────────────────────────────────
  async simulate(
    contractAddress: string,
    funcName: string,
    args: string[] = [],
    value = '0',
  ): Promise<McpQueryResult> {
    return this.callTool('mvx_sc_simulate', { contractAddress, funcName, args, value });
  }

  // ─── INTERNAL ────────────────────────────────────────────
  private async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpQueryResult> {
    if (!this.client || !this.connected) {
      return { success: false, data: null, error: 'MCP client not connected' };
    }
    try {
      const result = await this.client.callTool({ name, arguments: args });
      const content = result.content as Array<{ type: string; text?: string }>;
      const text = content?.find(c => c.type === 'text')?.text ?? '';
      const parsed = this.tryParse(text);
      return { success: true, data: parsed };
    } catch (err) {
      this.logger.error(`MCP tool ${name} error: ${(err as Error).message}`);
      return { success: false, data: null, error: (err as Error).message };
    }
  }

  private tryParse(text: string): unknown {
    try { return JSON.parse(text); } catch { return text; }
  }

  private resolveMcpBin(): string | null {
    const candidates = [
      path.resolve('node_modules/multiversx-sc-mcp/dist/index.js'),
      path.resolve('node_modules/@psorinionut/multiversx-sc-mcp/dist/index.js'),
    ];
    return candidates.find(p => fs.existsSync(p)) ?? null;
  }
}
