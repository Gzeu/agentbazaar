import {
  Controller, Get, Post, Param, Body,
  Query, DefaultValuePipe, ParseIntPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SubmitTaskDto, SubmitProofDto, OpenDisputeDto } from './dto/task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitTaskDto) {
    return this.svc.submitTask(dto);
  }

  @Get()
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.listTasks(page, limit);
  }

  @Get('consumer/:address')
  byConsumer(@Param('address') address: string) {
    return this.svc.getTasksByConsumer(address);
  }

  @Get('provider/:address')
  byProvider(@Param('address') address: string) {
    return this.svc.getTasksByProvider(address);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.svc.getTask(id);
  }

  @Post(':id/proof')
  @HttpCode(HttpStatus.OK)
  proof(@Param('id') id: string, @Body() dto: SubmitProofDto) {
    return this.svc.submitProof(id, dto);
  }

  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  dispute(
    @Param('id') id: string,
    @Body() dto: OpenDisputeDto & { callerAddress: string },
  ) {
    return this.svc.openDispute(id, dto, dto.callerAddress);
  }
}
