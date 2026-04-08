import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsObject,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SERVICE_CATEGORIES = [
  'data', 'compute', 'orchestration', 'compliance',
  'enrichment', 'wallet-actions', 'notifications', 'storage',
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export class RegisterServiceDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsIn(SERVICE_CATEGORIES) category: ServiceCategory;
  @IsString() version: string;
  @IsString() providerAddress: string;
  @IsString() endpoint: string;
  @IsString() pricingModel: string;
  @IsString() priceAmount: string;
  @IsString() priceToken: string;
  @IsNumber() @Min(50) @Max(30_000) maxLatencyMs: number;
  @IsNumber() @Min(0) @Max(100) uptimeGuarantee: number;
  @IsOptional() @IsObject() inputSchema?: Record<string, unknown>;
  @IsOptional() @IsObject() outputSchema?: Record<string, unknown>;
  @IsString() stakeAmount: string;
  @IsBoolean() ucpCompatible: boolean;
  @IsBoolean() mcpCompatible: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateServiceDto {
  @IsOptional() @IsString() priceAmount?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsObject() inputSchema?: Record<string, unknown>;
  @IsOptional() @IsObject() outputSchema?: Record<string, unknown>;
}

export class ServiceFilterDto {
  @IsOptional() @IsIn(SERVICE_CATEGORIES) category?: ServiceCategory;
  @IsOptional() @IsNumber() @Type(() => Number) minReputation?: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) ucpCompatible?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) mcpCompatible?: boolean;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumber() @Type(() => Number) @Min(1) page?: number;
  @IsOptional() @IsNumber() @Type(() => Number) @Min(1) @Max(100) limit?: number;
}
