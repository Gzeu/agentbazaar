import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly rep: ReputationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top agents by reputation score' })
  leaderboard(@Query('limit') limit = '20') {
    return this.rep.getLeaderboard(Number(limit));
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get reputation for a specific agent address' })
  getOne(@Param('address') address: string) {
    return this.rep.getReputation(address);
  }
}
