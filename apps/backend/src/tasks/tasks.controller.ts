import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Aggregated task metrics' })
  metrics() {
    return this.tasks.getMetrics();
  }

  @Get('consumer/:address')
  @ApiOperation({ summary: 'Tasks by consumer address' })
  byConsumer(
    @Param('address') address: string,
    @Query('limit') limit = '50',
  ) {
    return this.tasks.findAll({ limit: Number(limit), consumerId: address });
  }

  @Get('provider/:address')
  @ApiOperation({ summary: 'Tasks by provider address' })
  byProvider(
    @Param('address') address: string,
    @Query('limit') limit = '50',
  ) {
    return this.tasks.findAll({ limit: Number(limit), providerAddress: address });
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  findAll(
    @Query('limit') limit = '50',
    @Query('status') status?: string,
  ) {
    return this.tasks.findAll({ limit: Number(limit), status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a task (called after on-chain createTask TX)' })
  create(@Body() body: Record<string, unknown>) {
    return this.tasks.create(body);
  }

  @Post(':id/proof')
  @ApiOperation({ summary: 'Submit proof hash for a task' })
  proof(
    @Param('id') id: string,
    @Body() body: { proofHash: string; latencyMs: number },
  ) {
    return this.tasks.complete(id, body.proofHash, body.latencyMs);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task completed with proof hash' })
  complete(
    @Param('id') id: string,
    @Body() body: { proofHash: string; latencyMs: number },
  ) {
    return this.tasks.complete(id, body.proofHash, body.latencyMs);
  }
}
