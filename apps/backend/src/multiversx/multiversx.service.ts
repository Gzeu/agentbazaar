import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';
import { Address, SmartContract, AbiRegistry, ResultsParser } from '@multiversx/sdk-core';

@Injectable()
export class MultiversxService {
  private readonly logger = new Logger(MultiversxService.name);
  private readonly provider: ApiNetworkProvider;
  private readonly resultsParser = new ResultsParser();

  readonly REGISTRY_CONTRACT: string;
  readonly ESCROW_CONTRACT: string;
  readonly REPUTATION_CONTRACT: string;
  readonly NETWORK: string;
  readonly API_URL: string;

  constructor(private config: ConfigService) {
    this.NETWORK = config.get('MVX_NETWORK', 'devnet');
    this.REGISTRY_CONTRACT = config.get('REGISTRY_CONTRACT_ADDRESS', '');
    this.ESCROW_CONTRACT = config.get('ESCROW_CONTRACT_ADDRESS', '');
    this.REPUTATION_CONTRACT = config.get('REPUTATION_CONTRACT_ADDRESS', '');

    this.API_URL =
      this.NETWORK === 'mainnet'
        ? 'https://api.multiversx.com'
        : this.NETWORK === 'testnet'
        ? 'https://testnet-api.multiversx.com'
        : 'https://devnet-api.multiversx.com';

    this.provider = new ApiNetworkProvider(this.API_URL, { timeout: 10_000 });
    this.logger.log(`MultiversX [${this.NETWORK}] → ${this.API_URL}`);
  }

  getProvider(): ApiNetworkProvider {
    return this.provider;
  }

  async getNetworkConfig() {
    return this.provider.getNetworkConfig();
  }

  async getAccount(address: string) {
    return this.provider.getAccount(new Address(address));
  }

  /**
   * Broadcast a pre-signed transaction (sent from client SDK).
   * The client signs with their wallet — backend only relays.
   */
  async broadcastTransaction(signedTxRaw: Record<string, unknown>) {
    const txHash = await this.provider.sendTransaction(signedTxRaw as any);
    this.logger.log(`Tx broadcast: ${txHash}`);
    return { txHash };
  }

  /**
   * Query a smart contract view function (read-only, no gas).
   * Accepts raw args as Uint8Array or hex strings.
   */
  async queryView(
    contractAddress: string,
    funcName: string,
    args: string[] = [],
  ): Promise<any[]> {
    if (!contractAddress) return [];
    try {
      const query = {
        address: new Address(contractAddress),
        func: funcName,
        args: args.map((a) => Buffer.from(a, 'hex')),
        value: '0',
        caller: new Address('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu'),
      };
      const res = await this.provider.queryContract(query as any);
      return res.returnData ?? [];
    } catch (err) {
      this.logger.warn(`queryView ${funcName}@${contractAddress}: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetch recent transactions for a contract address from the API.
   */
  async getContractTransactions(
    address: string,
    size = 25,
  ): Promise<any[]> {
    if (!address) return [];
    try {
      const url = `${this.API_URL}/accounts/${address}/transactions?status=success&size=${size}&order=desc`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }
}
