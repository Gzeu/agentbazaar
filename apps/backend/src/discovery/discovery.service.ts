import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';

interface DiscoveryQuery {
  category?:     string;
  maxLatencyMs?: number;
  minScore?:     number;
  ucpRequired?:  boolean;
  mcpRequired?:  boolean;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly services: ServicesService) {}

  discover(query: DiscoveryQuery) {
    const { data: all } = this.services.findAll({ limit: 1000 });

    const filtered = all.filter(s => {
      if (!s.active) return false;
      if (query.category     && s.category !== query.category)       return false;
      if (query.maxLatencyMs && s.maxLatencyMs > query.maxLatencyMs) return false;
      if (query.minScore     && s.reputationScore < query.minScore)  return false;
      if (query.ucpRequired  && !s.ucpCompatible)                    return false;
      if (query.mcpRequired  && !s.mcpCompatible)                    return false;
      return true;
    });

    // Score by reputation + latency
    const scored = filtered.map(s => ({
      ...s,
      _score: s.reputationScore * 0.7 + (1000 / (s.maxLatencyMs || 1)) * 0.3,
    })).sort((a, b) => b._score - a._score);

    this.logger.debug(`Discovery: ${scored.length} results for query ${JSON.stringify(query)}`);

    return {
      query,
      results: scored,
      count: scored.length,
      timestamp: new Date().toISOString(),
    };
  }
}
