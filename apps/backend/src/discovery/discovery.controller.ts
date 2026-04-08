import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';

@ApiTags('Discovery')
@Controller('api/v1/discover')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  @ApiOperation({ summary: 'UCP-compatible service discovery endpoint' })
  async discover(
    @Query('q') query: string,
    @Query('category') category: string,
    @Query('maxPrice') maxPrice: string,
    @Query('minReputation') minReputation: number,
  ) {
    return this.discoveryService.discover({ query, category, maxPrice, minReputation });
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all available service categories' })
  async getCategories() {
    return this.discoveryService.getCategories();
  }
}
