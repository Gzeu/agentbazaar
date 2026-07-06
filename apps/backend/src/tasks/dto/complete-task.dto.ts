import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteTaskDto {
  @ApiProperty({ description: 'Proof hash returned by the provider' })
  @IsString()
  @IsNotEmpty()
  proofHash!: string;

  @ApiProperty({ description: 'Task execution latency in milliseconds' })
  @IsNumber()
  @Min(0)
  latencyMs!: number;
}
