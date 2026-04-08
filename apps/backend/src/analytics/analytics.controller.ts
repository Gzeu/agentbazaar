import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** GET /analytics — full dashboard snapshot */
  @Get()
  getDashboard() {
    return this.analytics.getDashboard();
  }

  /** GET /analytics/categories — task/service volume by category */
  @Get('categories')
  getCategories() {
    return this.analytics.getCategories();
  }

  /** GET /analytics/volume?days=7 — daily task volume */
  @Get('volume')
  getVolume(@Query('days') days = '7') {
    return this.analytics.getVolume(parseInt(days, 10));
  }
}
