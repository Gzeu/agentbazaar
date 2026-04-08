import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  findAll(@Query('limit') limit = '50', @Query('status') status?: string) {
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

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task completed with proof hash' })
  complete(@Param('id') id: string, @Body() body: { proofHash: string; latencyMs: number }) {
    return this.tasks.complete(id, body.proofHash, body.latencyMs);
  }
}
