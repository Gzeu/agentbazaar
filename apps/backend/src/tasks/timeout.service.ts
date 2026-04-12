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
    setInterval(() => this._checkTimeouts(), 30_000);
    this.logger.log('Timeout scanner started — 30s interval');
  }

  private _checkTimeouts() {
    const now = Date.now();
    const { tasks } = this.tasks.findAll({ limit: 10_000 });
    let refunded = 0;

    for (const task of tasks) {
      if (!['pending', 'running'].includes(task.status)) continue;
      if (now <= new Date(task.deadline).getTime()) continue;

      this.tasks.timeout(task.id);
      this.events.broadcast('TaskRefunded', {
        taskId:    task.id,
        serviceId: task.serviceId,
        consumer:  task.consumerId,
      });
      refunded++;
    }

    if (refunded > 0)
      this.logger.log(`Auto-refunded ${refunded} expired task(s)`);
  }
}
