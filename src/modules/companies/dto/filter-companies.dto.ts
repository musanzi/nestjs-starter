import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CompanySource } from '../enums';

export class FilterCompaniesDto {
  @ApiPropertyOptional({ type: 'integer', default: 1, minimum: 1, maximum: 2147483647 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  page: number = 1;

  @ApiPropertyOptional({ type: 'integer', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Case-insensitive literal name substring' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: CompanySource, enumName: 'CompanySource' })
  @IsOptional()
  @IsEnum(CompanySource)
  source?: CompanySource;
}
