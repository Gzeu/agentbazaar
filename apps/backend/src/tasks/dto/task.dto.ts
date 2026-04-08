import { IsString, IsObject, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitTaskDto {
  @ApiProperty() @IsString() serviceId: string;
  @ApiProperty() @IsString() consumerId: string;
  @ApiProperty() @IsString() providerAddress: string;
  @ApiProperty() @IsObject() payload: Record<string, unknown>;
  @ApiProperty() @IsString() maxBudget: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() deadlineSeconds?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() mandateId?: string;
}

export class SubmitProofDto {
  @ApiProperty() @IsString() proofHash: string;
  @ApiProperty() @IsString() providerAddress: string;
  @ApiProperty() @IsNumber() latencyMs: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() result?: Record<string, unknown>;
}
