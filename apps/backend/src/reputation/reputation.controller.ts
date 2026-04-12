import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly rep: ReputationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top agents ranked by composite score (bps 0-10000)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max entries returned (default 20)' })
  leaderboard(@Query('limit') limit = '20') {
    return this.rep.getLeaderboard(Number(limit));
    // returns { leaderboard: ReputationEntry[], total: number }
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get reputation entry for a specific agent address' })
  @ApiParam({ name: 'address', description: 'erd1... MultiversX address' })
  getOne(@Param('address') address: string) {
    return this.rep.getReputation(address);
  }
}
