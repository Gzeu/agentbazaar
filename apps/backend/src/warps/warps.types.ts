/**
 * Shared DTOs and types for the Warps module.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class PublishWarpDto {
  @ApiProperty({ description: 'Serialized Warp JSON (v3.0.0)' })
  @IsString()
  @IsNotEmpty()
  warpJson!: string;

  @ApiPropertyOptional({ description: 'Optional human-readable alias for the Warp' })
  @IsOptional()
  @IsString()
  alias?: string;
}

// qrDataUrl removed — it is client-only and should be generated in the frontend, not returned by the server
export interface WarpPublishResult {
  hash: string;
  alias?: string;
  url: string;
}

export type WarpActionType =
  | 'transfer'
  | 'contract'
  | 'query'
  | 'collect'
  | 'link'
  | 'mcp'
  | 'prompt'
  | 'inline';

export interface WarpResolved {
  warp: Record<string, unknown>;
  meta: {
    hash: string;
    identifier: string;
    creator: string;
    createdAt: string;
    chain: string;
    query: Record<string, unknown> | null;
  };
}
