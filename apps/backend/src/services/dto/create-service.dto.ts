import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: ['data', 'compute', 'wallet-actions', 'compliance', 'enrichment', 'orchestration', 'notifications'] })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ERD provider address' })
  @IsString()
  @IsNotEmpty()
  providerAddress!: string;

  @ApiProperty({ description: 'MCP endpoint URL' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiPropertyOptional({ enum: ['per-call', 'subscription', 'pay-as-you-go'] })
  @IsOptional()
  @IsString()
  pricingModel?: string;

  @ApiProperty({ description: 'Price in EGLD denomination (string)' })
  @IsString()
  priceAmount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLatencyMs?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  uptimeGuarantee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ucpCompatible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mcpCompatible?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
