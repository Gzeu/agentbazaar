import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type ServiceCategory =
  | 'data-fetching'
  | 'compute-offload'
  | 'wallet-actions'
  | 'compliance'
  | 'enrichment'
  | 'orchestration'
  | 'notifications';

export type PricingModel = 'per_request' | 'per_second' | 'per_result' | 'subscription';

export class RegisterServiceDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() category: ServiceCategory;
  @ApiProperty() @IsString() version: string;
  @ApiProperty() @IsString() providerAddress: string;
  @ApiProperty() @IsString() endpoint: string;
  @ApiProperty() @IsString() pricingModel: PricingModel;
  @ApiProperty() @IsString() priceAmount: string;
  @ApiProperty() @IsString() priceToken: string;
  @ApiProperty() @IsNumber() @Min(100) @Max(60000) maxLatencyMs: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(1) uptimeGuarantee: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() inputSchema?: Record<string, unknown>;
  @ApiPropertyOptional() @IsObject() @IsOptional() outputSchema?: Record<string, unknown>;
  @ApiProperty() @IsString() stakeAmount: string;
  @ApiProperty() @IsBoolean() ucpCompatible: boolean;
  @ApiProperty() @IsBoolean() mcpCompatible: boolean;
  @ApiPropertyOptional() @IsString({ each: true }) @IsOptional() tags?: string[];
}

export class UpdateServiceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() descriptorHash?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() priceAmount?: string;
  @ApiPropertyOptional() @IsObject() @IsOptional() inputSchema?: Record<string, unknown>;
  @ApiPropertyOptional() @IsObject() @IsOptional() outputSchema?: Record<string, unknown>;
}

export class ServiceFilterDto {
  @ApiPropertyOptional() @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() maxPrice?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() minReputation?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() ucpCompatible?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() mcpCompatible?: boolean;
  @ApiPropertyOptional() @IsNumber() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() limit?: number;
}
