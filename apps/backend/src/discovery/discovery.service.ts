import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';

interface DiscoveryQuery {
  category?:     string;
  tags?:         string[];
  maxLatencyMs?: number;
  minScore?:     number;  // bps 0-10000
  ucpRequired?:  boolean;
  mcpRequired?:  boolean;
  limit?:        number;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly services: ServicesService) {}

  discover(query: DiscoveryQuery) {
    const { services: all } = this.services.findAll({ limit: 1000 });

    const filtered = all.filter(s => {
      if (!s.active)                                              return false;
      if (query.category     && s.category !== query.category)   return false;
      if (query.maxLatencyMs && s.maxLatencyMs > query.maxLatencyMs) return false;
      // minScore in bps (0-10000); reputationScore is also bps
      if (query.minScore     && s.reputationScore < query.minScore)  return false;
      if (query.ucpRequired  && !s.ucpCompatible)                    return false;
      if (query.mcpRequired  && !s.mcpCompatible)                    return false;
      if (query.tags?.length && !query.tags.every(t => s.tags.includes(t))) return false;
      return true;
    });

    // Composite score: 70% reputation (normalised from bps) + 30% latency bonus
    const scored = filtered.map(s => ({
      ...s,
      _score: (s.reputationScore / 10000) * 0.7 * 100
             + Math.max(0, 30 - (s.maxLatencyMs / 1000) * 30),
    })).sort((a, b) => b._score - a._score);

    const limit = Math.min(query.limit ?? 50, 100);
    const results = scored.slice(0, limit);

    this.logger.debug(
      `Discovery: ${results.length}/${filtered.length} results for ${JSON.stringify(query)}`,
    );

    return {
      query,
      results,
      count:     results.length,
      total:     filtered.length,
      timestamp: new Date().toISOString(),
    };
  }
}
