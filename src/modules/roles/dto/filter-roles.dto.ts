import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/shared/dto';

export class FilterRolesDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  q?: string;
}
