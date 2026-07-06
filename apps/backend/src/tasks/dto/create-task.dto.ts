import { IsString, IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiPropertyOptional({ description: 'Optional task ID (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Service ID this task is for' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Consumer ERD address' })
  @IsString()
  @IsNotEmpty()
  consumerId!: string;

  @ApiProperty({ description: 'Provider ERD address' })
  @IsString()
  @IsNotEmpty()
  providerAddress!: string;

  @ApiProperty({ description: 'Max budget in EGLD denomination (string)' })
  @IsNumberString()
  maxBudget!: string;

  @ApiPropertyOptional({ description: 'SHA-256 hash of the task payload' })
  @IsOptional()
  @IsString()
  payloadHash?: string;

  @ApiPropertyOptional({ description: 'On-chain escrow transaction hash' })
  @IsOptional()
  @IsString()
  escrowTxHash?: string;

  @ApiPropertyOptional({ description: 'ISO deadline (defaults to now + 1800s)' })
  @IsOptional()
  @IsString()
  deadline?: string;
}
