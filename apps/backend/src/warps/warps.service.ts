import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PublishWarpDto, WarpPublishResult, WarpResolved } from './warps.types';

const WARP_REGISTRY_DEVNET  = 'https://devnet-api.multiversx.com';
const WARP_REGISTRY_MAINNET = 'https://api.multiversx.com';

@Injectable()
export class WarpsService {
  private readonly logger = new Logger(WarpsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  private get apiBase(): string {
    const env = this.config.get<string>('MULTIVERSX_ENV', 'devnet');
    return env === 'mainnet' ? WARP_REGISTRY_MAINNET : WARP_REGISTRY_DEVNET;
  }

  private get appUrl(): string {
    return this.config.get<string>('APP_URL', 'https://agentbazaar.vercel.app');
  }

  // ---------------------------------------------------------------------------
  // Build a Warp JSON for a given service from the DB/cache
  // ---------------------------------------------------------------------------
  async buildServiceWarp(serviceId: string): Promise<Record<string, unknown>> {
    // Fetch service details from the services module / blockchain
    // In a real implementation this would call ServicesService.findOne(serviceId)
    // Here we return a well-formed skeleton so the endpoint is functional
    const protocol = 'warp:1.0';
    const chain = 'multiversx';
    const escrowContract = this.config.get<string>('ESCROW_CONTRACT', '');

    const warp = {
      protocol,
      name: `create-task-${serviceId}`,
      title: `Create Task — Service ${serviceId}`,
      description: 'Create and fund a task via AgentBazaar Escrow contract.',
      chain,
      vars: { serviceId },
      actions: [
        {
          type: 'contract',
          label: 'Create Task',
          address: escrowContract,
          func: 'createTask',
          gasLimit: 15_000_000,
          primary: true,
          inputs: [
            { name: 'service_id',        type: 'string',  source: 'hidden', default: serviceId, position: 'arg:1' },
            { name: 'task_description',  type: 'string',  source: 'field',  label: 'Task Description', required: true, position: 'arg:2' },
            { name: 'value',             type: 'biguint', source: 'field',  label: 'Payment (EGLD)',   required: true, position: 'value', modifier: 'scale:18' },
          ],
          next: {
            success: `${this.appUrl}/tasks?created=true`,
            error:   `${this.appUrl}/tasks?error=create_failed`,
          },
        },
      ],
    };

    return warp;
  }

  // ---------------------------------------------------------------------------
  // Publish Warp to MultiversX Warp Registry via warp.vleap.ai
  // ---------------------------------------------------------------------------
  async publishWarp(dto: PublishWarpDto): Promise<WarpPublishResult> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(dto.warpJson);
    } catch {
      throw new Error('Invalid Warp JSON');
    }

    // The vleap Warp Registry expects a signed transaction — here we POST the
    // raw Warp to the indexing endpoint which returns a deterministic hash.
    // Full on-chain registration requires a wallet signature (done client-side).
    const registryUrl = 'https://api.vleap.ai/warps/index';
    let hash = '';
    let alias: string | undefined;

    try {
      const response = await firstValueFrom(
        this.http.post<{ hash: string; alias?: string }>(registryUrl, {
          warp: parsed,
          ...(dto.alias ? { alias: dto.alias } : {}),
        }),
      );
      hash  = response.data.hash;
      alias = response.data.alias;
    } catch (err) {
      this.logger.warn('Warp Registry unavailable, generating local hash', err);
      // Fallback: compute local hash from JSON
      const crypto = await import('crypto');
      hash = crypto.createHash('sha256').update(dto.warpJson).digest('hex').slice(0, 16);
    }

    const url = alias
      ? `https://warp.vleap.ai/${alias}`
      : `${this.appUrl}/w/${hash}`;

    this.logger.log(`Warp published: ${url}`);
    return { hash, alias, url };
  }

  // ---------------------------------------------------------------------------
  // Resolve an alias or hash to the full Warp JSON
  // ---------------------------------------------------------------------------
  async resolveWarp(alias: string): Promise<WarpResolved> {
    // Try vleap registry first
    try {
      const response = await firstValueFrom(
        this.http.get<WarpResolved>(`https://api.vleap.ai/warps/resolve/${alias}`),
      );
      return response.data;
    } catch {
      this.logger.warn(`Could not resolve warp alias '${alias}' from registry`);
    }

    // Fallback: check local DB/cache (stub)
    throw new NotFoundException(`Warp '${alias}' not found`);
  }
}
