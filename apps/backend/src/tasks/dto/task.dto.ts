import {
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitTaskDto {
  @IsString() serviceId: string;
  @IsString() consumerId: string;    // erd1 address of the consumer
  @IsString() providerAddress: string; // erd1 address of the provider
  @IsObject() payload: Record<string, unknown>;
  @IsString() maxBudget: string;     // EGLD amount in denomination, e.g. "1000000000000000"
  @IsOptional() @IsNumber() @Type(() => Number) @Min(30) @Max(3600) deadlineSeconds?: number;
  @IsOptional() @IsString() escrowTxHash?: string; // On-chain createTask tx hash (from client)
}

export class SubmitProofDto {
  @IsString() proofHash: string;     // SHA-256 hash of the result
  @IsObject() result: Record<string, unknown>;
  @IsNumber() @Type(() => Number) @Min(0) latencyMs: number;
  @IsOptional() @IsString() signedReleasePayload?: string; // pre-signed releaseEscrow tx
}

export enum DisputeReason {
  TIMEOUT = 'timeout',
  WRONG_RESULT = 'wrong_result',
  NO_PROOF = 'no_proof',
  FRAUD = 'fraud',
}

export class OpenDisputeDto {
  @IsEnum(DisputeReason) reason: DisputeReason;
  @IsOptional() @IsString() evidence?: string;
}
