import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly rep: ReputationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top agents by reputation score (on-chain + in-memory)' })
  leaderboard(@Query('limit') limit = '20') {
    return {
      data: this.rep.getAll().slice(0, Number(limit)),
      total: this.rep.getAll().length,
    };
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get reputation for a specific agent (on-chain first, fallback in-memory)' })
  async getOne(@Param('address') address: string) {
    return this.rep.getScore(address);
  }
}
