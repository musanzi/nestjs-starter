import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  page?: number | string;

  @ApiPropertyOptional({ example: 10 })
  limit?: number | string;

  @ApiPropertyOptional({ example: 10 })
  take?: number | string;
}
