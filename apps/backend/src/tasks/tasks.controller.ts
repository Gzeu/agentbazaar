import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { SubmitTaskDto, SubmitProofDto } from './dto/task.dto';

@ApiTags('Tasks')
@Controller('api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a task to a provider agent' })
  async submitTask(@Body() dto: SubmitTaskDto) {
    return this.tasksService.submitTask(dto);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task status and result' })
  async getTask(@Param('taskId') taskId: string) {
    return this.tasksService.getTask(taskId);
  }

  @Post(':taskId/proof')
  @ApiOperation({ summary: 'Submit execution proof for a task' })
  async submitProof(
    @Param('taskId') taskId: string,
    @Body() dto: SubmitProofDto,
  ) {
    return this.tasksService.submitProof(taskId, dto);
  }

  @Get('consumer/:address')
  @ApiOperation({ summary: 'Get all tasks by consumer address' })
  async getTasksByConsumer(@Param('address') address: string) {
    return this.tasksService.getTasksByConsumer(address);
  }

  @Get('provider/:address')
  @ApiOperation({ summary: 'Get all tasks by provider address' })
  async getTasksByProvider(@Param('address') address: string) {
    return this.tasksService.getTasksByProvider(address);
  }
}
