import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Full dashboard snapshot — tasks, TVL, services, reputation' })
  getDashboard() {
    return this.analytics.getDashboard();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Task/service volume grouped by category' })
  getCategories() {
    return this.analytics.getCategories();
  }

  @Get('volume')
  @ApiOperation({ summary: 'Daily task volume for the last N days' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getVolume(@Query('days') days = '7') {
    return this.analytics.getVolume(parseInt(days, 10));
  }
}
