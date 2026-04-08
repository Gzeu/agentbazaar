import type { ServiceDescriptor, ServiceCategory } from './types';

export interface DiscoveryFilters {
  category?: ServiceCategory;
  maxPricePerRequest?: string;
  minReputationScore?: number;
  ucpCompatible?: boolean;
  mcpCompatible?: boolean;
}

/**
 * AgentBazaar Discovery Client
 * Find services matching agent requirements
 */
export class DiscoveryClient {
  constructor(private readonly indexerUrl: string) {}

  /**
   * Search marketplace for services matching filters
   */
  async search(filters: DiscoveryFilters): Promise<ServiceDescriptor[]> {
    // TODO: Query indexer API
    throw new Error('Not implemented');
  }

  /**
   * Get best quote for a service request
   */
  async getQuote(
    serviceId: string,
    payload: Record<string, unknown>,
  ): Promise<{ price: string; estimatedLatencyMs: number }> {
    throw new Error('Not implemented');
  }
}
