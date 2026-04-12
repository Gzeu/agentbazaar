import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AgentExecutorService } from './agent-executor.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private readonly tasks: TasksService,
    private readonly executor: AgentExecutorService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks with optional status filter' })
  findAll(@Query('limit') limit = '50', @Query('status') status?: string) {
    return this.tasks.findAll({ limit: Number(limit), status });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Task execution metrics (success rate, avg latency, on-chain rate)' })
  metrics() {
    return this.tasks.getMetrics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasks.findOne(id);
  }

  /**
   * POST /tasks
   * Called by a consumer AI agent after locking escrow on-chain.
   * Body:
   *   serviceId       — ID of the service to invoke
   *   consumerId      — erd1... address of the buyer
   *   providerAddress — erd1... address of the provider
   *   maxBudget       — EGLD amount in smallest denomination
   *   payloadHash     — sha256 of the task payload (optional)
   *   escrowTxHash    — txHash of the createTask escrow TX (x402 proof)
   *   deadline        — ISO timestamp
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a task (x402 escrow tx required in production)' })
  @ApiHeader({ name: 'X-Payment-TxHash', required: false, description: 'x402 escrow tx hash' })
  @ApiHeader({ name: 'X-Payment-Network', required: false, description: 'e.g. multiversx-devnet' })
  async create(
    @Body() body: Record<string, unknown>,
    @Headers('x-payment-txhash') paymentTxHash?: string,
    @Headers('x-payment-network') paymentNetwork?: string,
  ) {
    // x402 header takes priority over body field
    const enriched = {
      ...body,
      escrowTxHash: paymentTxHash ?? body.escrowTxHash,
      paymentNetwork: paymentNetwork ?? 'multiversx-devnet',
    };
    return this.tasks.create(enriched);
  }

  /**
   * POST /tasks/:id/execute
   * Provider endpoint — called by AgentExecutorService (or external provider agents).
   * Returns a result payload that gets hashed as proof.
   */
  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a task (provider-side endpoint)' })
  @ApiHeader({ name: 'X-AgentBazaar-TaskId', required: false })
  @ApiHeader({ name: 'X-Payment-TxHash', required: false })
  async execute(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-payment-txhash') paymentTxHash?: string,
  ) {
    this.logger.log(`Execute called for task ${id} (payment: ${paymentTxHash ?? 'none'})`);

    // Delegate to AgentExecutorService for autonomous execution
    const result = await this.executor.executeAutonomous(id, body);
    return result;
  }

  /**
   * POST /tasks/:id/complete
   * Manual completion — used by external provider agents that handle execution themselves.
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark task completed with proof hash (external provider)' })
  complete(
    @Param('id') id: string,
    @Body() body: { proofHash: string; latencyMs: number },
  ) {
    return this.tasks.complete(id, body.proofHash, body.latencyMs);
  }

  /**
   * POST /tasks/:id/dispute
   * Consumer can open a dispute within the deadline window.
   */
  @Post(':id/dispute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open a dispute for a task' })
  dispute(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.tasks.dispute(id, body.reason);
  }
}
