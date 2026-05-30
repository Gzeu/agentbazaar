import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WarpsService } from './warps.service';
import { PublishWarpDto, WarpPublishResult, WarpResolved } from './warps.types';

@ApiTags('warps')
@Controller('warps')
export class WarpsController {
  constructor(private readonly warpsService: WarpsService) {}

  /**
   * GET /warps/:serviceId
   * Returns a ready-to-embed/share Warp JSON for a given marketplace service.
   */
  @Get(':serviceId')
  @ApiOperation({ summary: 'Get Warp JSON for a service' })
  @ApiParam({ name: 'serviceId', description: 'Marketplace service identifier' })
  @ApiResponse({ status: 200, description: 'Warp v3.0.0 JSON object' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getWarp(@Param('serviceId') serviceId: string): Promise<Record<string, unknown>> {
    return this.warpsService.buildServiceWarp(serviceId);
  }

  /**
   * POST /warps/publish
   * Publishes a Warp to the MultiversX Warp Registry and returns the short URL.
   */
  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publish a Warp to the registry' })
  @ApiResponse({ status: 201, description: 'Warp published — returns URL + hash' })
  async publishWarp(@Body() dto: PublishWarpDto): Promise<WarpPublishResult> {
    return this.warpsService.publishWarp(dto);
  }

  /**
   * GET /warps/resolve/:alias
   * Resolves a Warp alias or hash to the full Warp JSON + meta.
   */
  @Get('resolve/:alias')
  @ApiOperation({ summary: 'Resolve a Warp alias to full JSON' })
  @ApiParam({ name: 'alias', description: 'Warp alias or hash' })
  @ApiResponse({ status: 200, description: 'Full Warp JSON with meta' })
  @ApiResponse({ status: 404, description: 'Warp not found' })
  async resolveWarp(@Param('alias') alias: string): Promise<WarpResolved> {
    return this.warpsService.resolveWarp(alias);
  }
}
