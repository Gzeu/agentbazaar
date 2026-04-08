import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';

@ApiTags('Reputation')
@Controller('api/v1/reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get(':address')
  @ApiOperation({ summary: 'Get reputation score for an agent address' })
  async getReputation(@Param('address') address: string) {
    return this.reputationService.getReputation(address);
  }

  @Get(':address/history')
  @ApiOperation({ summary: 'Get task history for an agent' })
  async getHistory(@Param('address') address: string) {
    return this.reputationService.getHistory(address);
  }
}
