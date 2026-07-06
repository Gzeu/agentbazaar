import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filters and cursor pagination' })
  @ApiQuery({ name: 'limit',  required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['pending','running','completed','failed','disputed','refunded'] })
  @ApiQuery({ name: 'after',  required: false, description: 'Cursor: last task ID from previous page' })
  findAll(
    @Query('limit')  limit  = '20',
    @Query('status') status?: string,
    @Query('after')  after?: string,
  ) {
    return this.tasks.findAll({ limit: Number(limit), status, after });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a task after on-chain createTask TX' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task completed with proof hash and latency' })
  complete(@Param('id') id: string, @Body() dto: CompleteTaskDto) {
    return this.tasks.complete(id, dto);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Open a dispute on a task' })
  dispute(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.tasks.dispute(id, body.reason ?? 'No reason provided');
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a timed-out pending task' })
  refund(@Param('id') id: string) {
    return this.tasks.refund(id);
  }
}
