import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MultiversxService implements OnModuleInit {
  private readonly logger = new Logger(MultiversxService.name);
  private apiUrl: string;
  private registryAddr: string;
  private escrowAddr: string;
  private reputationAddr: string;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.apiUrl          = this.config.get('MVX_API_URL', 'https://devnet-api.multiversx.com');
    this.registryAddr    = this.config.get('REGISTRY_CONTRACT_ADDRESS', '');
    this.escrowAddr      = this.config.get('ESCROW_CONTRACT_ADDRESS', '');
    this.reputationAddr  = this.config.get('REPUTATION_CONTRACT_ADDRESS', '');

    if (!this.registryAddr) {
      this.logger.warn('REGISTRY_CONTRACT_ADDRESS not set — using mock data only');
    } else {
      this.logger.log(`Registry:   ${this.registryAddr}`);
      this.logger.log(`Escrow:     ${this.escrowAddr}`);
      this.logger.log(`Reputation: ${this.reputationAddr}`);
    }
  }

  get addresses() {
    return {
      registry:   this.registryAddr,
      escrow:     this.escrowAddr,
      reputation: this.reputationAddr,
    };
  }

  async getAccount(address: string) {
    try {
      const { data } = await axios.get(`${this.apiUrl}/accounts/${address}`, { timeout: 5000 });
      return data;
    } catch {
      return null;
    }
  }

  async queryContract(contractAddress: string, funcName: string, args: string[] = []) {
    try {
      const payload: Record<string, unknown> = {
        scAddress: contractAddress,
        funcName,
        args,
        caller: contractAddress,
        value: '0',
      };
      const { data } = await axios.post(
        `${this.apiUrl}/vm-values/query`,
        payload,
        { timeout: 8000 },
      );
      return data?.data?.data ?? data?.data ?? null;
    } catch (err) {
      this.logger.warn(`queryContract ${funcName} failed: ${(err as Error).message}`);
      return null;
    }
  }

  async getTransactionsByAddress(address: string, size = 20) {
    try {
      const { data } = await axios.get(
        `${this.apiUrl}/accounts/${address}/transactions?size=${size}&order=desc`,
        { timeout: 8000 },
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getNetworkStatus() {
    try {
      const { data } = await axios.get(`${this.apiUrl}/network/status`, { timeout: 5000 });
      return data;
    } catch {
      return null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.registryAddr && this.escrowAddr && this.reputationAddr);
  }
}
