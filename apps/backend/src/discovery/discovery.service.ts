import { Injectable } from '@nestjs/common';
import { ServicesService } from '../services/services.service';

@Injectable()
export class DiscoveryService {
  constructor(private readonly servicesService: ServicesService) {}

  async discover(filters: {
    query?: string;
    category?: string;
    maxPrice?: string;
    minReputation?: number;
  }) {
    const results = await this.servicesService.listServices({
      category: filters.category,
      maxPrice: filters.maxPrice,
      minReputation: filters.minReputation,
    });

    // Text search by name/description
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results.data = results.data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return {
      services: results.data,
      total: results.total,
      ucpVersion: '1.0',
      timestamp: new Date().toISOString(),
    };
  }

  getCategories() {
    return {
      categories: [
        { id: 'data-fetching', label: 'Data Fetching', description: 'Web scraping, APIs, oracles' },
        { id: 'compute-offload', label: 'Compute Offload', description: 'Inference, embeddings, processing' },
        { id: 'wallet-actions', label: 'Wallet Actions', description: 'Signing, staking, swaps' },
        { id: 'compliance', label: 'Compliance', description: 'KYC, risk scoring, AML' },
        { id: 'enrichment', label: 'Enrichment', description: 'Semantic enrichment, entity extraction' },
        { id: 'orchestration', label: 'Orchestration', description: 'Agent team workflows, pipelines' },
        { id: 'notifications', label: 'Notifications', description: 'Webhooks, alerts, messaging' },
      ],
    };
  }
}
