import { Controller, Get, Param, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ReputationService } from './reputation.service';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly svc: ReputationService) {}

  @Get('leaderboard')
  leaderboard(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.svc.getLeaderboard(Math.min(limit, 200));
  }

  @Get(':address')
  getOne(@Param('address') address: string) {
    return this.svc.getReputation(address);
  }
}
