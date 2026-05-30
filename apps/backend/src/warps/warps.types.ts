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

/**
 * Result returned by the server after publishing a Warp.
 * Note: qrDataUrl is intentionally omitted here — QR generation is client-only.
 */
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
