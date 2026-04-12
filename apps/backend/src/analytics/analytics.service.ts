import { Injectable } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { ServicesService } from '../services/services.service';
import { ReputationService } from '../reputation/reputation.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly tasks:      TasksService,
    private readonly services:   ServicesService,
    private readonly reputation: ReputationService,
  ) {}

  getDashboard() {
    const { tasks: allTasks }       = this.tasks.findAll({ limit: 10_000 });
    const { services: allServices } = this.services.findAll({ limit: 10_000 });
    const { leaderboard }           = this.reputation.getLeaderboard(100);

    const completed = allTasks.filter(t => t.status === 'completed');
    const failed    = allTasks.filter(t => t.status === 'failed');
    const running   = allTasks.filter(t => t.status === 'running');
    const disputed  = allTasks.filter(t => t.status === 'disputed');
    const pending   = allTasks.filter(t => t.status === 'pending');

    const withLatency = completed.filter(t => t.latencyMs != null);
    const avgLatency  = withLatency.length
      ? withLatency.reduce((s, t) => s + t.latencyMs!, 0) / withLatency.length
      : 0;

    const tvlWei = [...running, ...pending].reduce(
      (s, t) => s + BigInt(t.maxBudget ?? '0'), BigInt(0),
    );

    const completionRate = allTasks.length
      ? completed.length / allTasks.length : 0;

    return {
      timestamp: new Date().toISOString(),
      tasks: {
        total:          allTasks.length,
        completed:      completed.length,
        failed:         failed.length,
        running:        running.length,
        pending:        pending.length,
        disputed:       disputed.length,
        completionRate: +completionRate.toFixed(4),
        avgLatencyMs:   +avgLatency.toFixed(0),
      },
      tvl: {
        wei:  tvlWei.toString(),
        egld: (Number(tvlWei) / 1e18).toFixed(6),
      },
      services: {
        total:  allServices.length,
        active: allServices.filter(s => s.active).length,
      },
      reputation: {
        totalProviders: leaderboard.length,
        avgScore: leaderboard.length
          ? +(leaderboard.reduce((s, r) => s + r.compositeScore, 0) / leaderboard.length).toFixed(1)
          : 0,
        topScore: leaderboard[0]?.compositeScore ?? 0,
      },
    };
  }

  getCategories() {
    const { services: allServices } = this.services.findAll({ limit: 10_000 });
    const { tasks: allTasks }       = this.tasks.findAll({ limit: 10_000 });

    const serviceMap = new Map(allServices.map(s => [s.id, s.category]));
    const byCategory: Record<string, { services: number; tasks: number }> = {};

    for (const s of allServices) {
      byCategory[s.category] ??= { services: 0, tasks: 0 };
      byCategory[s.category].services++;
    }
    for (const t of allTasks) {
      const cat = serviceMap.get(t.serviceId) ?? 'unknown';
      byCategory[cat] ??= { services: 0, tasks: 0 };
      byCategory[cat].tasks++;
    }
    return { categories: byCategory, timestamp: new Date().toISOString() };
  }

  getVolume(days = 7) {
    const { tasks: allTasks } = this.tasks.findAll({ limit: 10_000 });
    const result: Record<string, { tasks: number; completed: number; volumeEgld: number }> = {};
    const now = Date.now();

    for (let i = 0; i < days; i++) {
      const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
      result[d] = { tasks: 0, completed: 0, volumeEgld: 0 };
    }
    for (const t of allTasks) {
      const d = t.createdAt.slice(0, 10);
      if (result[d]) {
        result[d].tasks++;
        if (t.status === 'completed') result[d].completed++;
        result[d].volumeEgld += Number(t.maxBudget ?? 0) / 1e18;
      }
    }
    return {
      days,
      series: Object.entries(result)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    };
  }
}
