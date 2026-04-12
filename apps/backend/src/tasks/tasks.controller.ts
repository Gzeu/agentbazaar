import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks (paginated)' })
  @ApiQuery({ name: 'limit',  required: false, description: 'Default 50' })
  @ApiQuery({ name: 'status', required: false, description: 'pending|running|completed|failed|disputed' })
  findAll(
    @Query('limit')  limit  = '50',
    @Query('status') status?: string,
  ) {
    return this.tasks.findAll({ limit: Number(limit), status });
    // returns { tasks: TaskRecord[], total: number }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a task (after on-chain createTask TX)' })
  create(@Body() body: Record<string, unknown>) {
    return this.tasks.create(body);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task completed with proof hash' })
  @ApiParam({ name: 'id' })
  complete(
    @Param('id') id: string,
    @Body() body: { proofHash: string; latencyMs: number },
  ) {
    return this.tasks.complete(id, body.proofHash, body.latencyMs);
  }
}
