import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiNetworkProvider,
  ProxyNetworkProvider,
} from '@multiversx/sdk-network-providers';
import {
  Address,
  SmartContract,
  AbiRegistry,
  ResultsParser,
  ContractCallPayloadBuilder,
  ContractFunction,
  StringValue,
  BigUIntValue,
  U8Value,
  BooleanValue,
  AddressValue,
} from '@multiversx/sdk-core';

@Injectable()
export class MultiversxService {
  private readonly logger = new Logger(MultiversxService.name);
  private readonly provider: ApiNetworkProvider;

  readonly REGISTRY_CONTRACT: string;
  readonly ESCROW_CONTRACT: string;
  readonly REPUTATION_CONTRACT: string;
  readonly NETWORK: string;

  constructor(private config: ConfigService) {
    this.NETWORK = config.get('MVX_NETWORK', 'devnet');
    this.REGISTRY_CONTRACT = config.get('REGISTRY_CONTRACT_ADDRESS', '');
    this.ESCROW_CONTRACT = config.get('ESCROW_CONTRACT_ADDRESS', '');
    this.REPUTATION_CONTRACT = config.get('REPUTATION_CONTRACT_ADDRESS', '');

    const apiUrl =
      this.NETWORK === 'mainnet'
        ? 'https://api.multiversx.com'
        : this.NETWORK === 'testnet'
        ? 'https://testnet-api.multiversx.com'
        : 'https://devnet-api.multiversx.com';

    this.provider = new ApiNetworkProvider(apiUrl, { timeout: 10000 });
    this.logger.log(`MultiversX provider: ${apiUrl}`);
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

  async queryContract(
    contractAddress: string,
    funcName: string,
    args: any[] = [],
  ) {
    const contract = new SmartContract({
      address: new Address(contractAddress),
    });
    // In production: decode via ABI
    return { contractAddress, funcName, args };
  }

  async broadcastTransaction(signedTx: any) {
    return this.provider.sendTransaction(signedTx);
  }
}
