import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { EventsGateway } from '../events/events.gateway';

/**
 * Scans tasks every 30s and auto-refunds those past deadline
 * while still in pending/running status.
 */
@Injectable()
export class TimeoutService implements OnModuleInit {
  private readonly logger = new Logger(TimeoutService.name);

  constructor(
    private readonly tasks:  TasksService,
    private readonly events: EventsGateway,
  ) {}

  onModuleInit() {
    setInterval(() => this.checkTimeouts(), 30_000);
    this.logger.log('Timeout scanner started — 30s interval');
  }

  private checkTimeouts() {
    const now  = Date.now();
    const { data } = this.tasks.findAll({ limit: 10000 });
    let refunded = 0;

    for (const task of data) {
      if (!['pending', 'running'].includes(task.status)) continue;
      const deadline = new Date(task.deadline).getTime();
      if (now > deadline) {
        this.tasks.timeout(task.id);
        this.events.emitEvent({
          type:      'TaskRefunded',
          taskId:    task.id,
          hash:      undefined,
          timestamp: new Date().toISOString(),
        });
        refunded++;
      }
    }
    if (refunded > 0)
      this.logger.log(`Auto-refunded ${refunded} expired task(s)`);
  }
}
