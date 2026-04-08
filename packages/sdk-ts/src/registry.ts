import type { ServiceDescriptor } from './types';

/**
 * AgentBazaar Registry Client
 * Handles service registration and on-chain listing
 */
export class RegistryClient {
  constructor(
    private readonly contractAddress: string,
    private readonly networkProvider: string,
  ) {}

  /**
   * Register a new service offering on-chain
   */
  async register(descriptor: ServiceDescriptor): Promise<string> {
    // TODO: Serialize descriptor, compute hash, send tx to registry contract
    throw new Error('Not implemented — connect MultiversX tx sender');
  }

  /**
   * Deregister a service
   */
  async deregister(serviceId: string, ownerAddress: string): Promise<string> {
    throw new Error('Not implemented');
  }

  /**
   * Fetch service by ID
   */
  async getService(serviceId: string): Promise<ServiceDescriptor | null> {
    throw new Error('Not implemented');
  }
}
