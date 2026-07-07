import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly rep: ReputationService) {}

  /**
   * GET /api/v1/reputation?limit=10
   * Used by frontend reputationApi.leaderboard()
   */
  @Get()
  @ApiOperation({ summary: 'Get reputation leaderboard (top agents by score)' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  leaderboard(@Query('limit') limit = '10') {
    return this.rep.getLeaderboard(Number(limit));
  }

  /**
   * GET /api/v1/reputation/:address
   * Used by frontend reputationApi.get(address)
   */
  @Get(':address')
  @ApiOperation({ summary: 'Get reputation for a specific agent address' })
  getOne(@Param('address') address: string) {
    return this.rep.getReputation(address);
  }
}
