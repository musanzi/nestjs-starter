import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ArchiveCompanyDto {
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 2147483647, example: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  expectedVersion: number;
}
