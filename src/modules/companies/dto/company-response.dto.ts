import { ApiProperty } from '@nestjs/swagger';
import { CompanySource } from '../enums';
import { ICompaniesPage, ICompanyResponse } from '../interfaces';

export class CompanyResponse implements ICompanyResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: 255, example: 'Example Exhibitor' })
  name: string;

  @ApiProperty({ enum: CompanySource, enumName: 'CompanySource' })
  source: CompanySource;

  @ApiProperty({ type: String, nullable: true, maxLength: 128 })
  odooInstanceId: string | null;

  @ApiProperty({ type: String, nullable: true, maxLength: 128, example: 'res.partner' })
  odooModel: string | null;

  @ApiProperty({ type: String, nullable: true, maxLength: 128, example: '123' })
  odooRecordId: string | null;

  @ApiProperty({ type: 'integer', minimum: 1 })
  version: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CompaniesPageResponse implements ICompaniesPage {
  @ApiProperty({ type: [CompanyResponse] })
  items: CompanyResponse[];

  @ApiProperty({ type: 'integer', minimum: 0 })
  total: number;

  @ApiProperty({ type: 'integer', minimum: 1 })
  page: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 100 })
  limit: number;
}

export class CompanyApiResponse {
  @ApiProperty({ enum: [true] })
  success: true;

  @ApiProperty({ type: 'integer', enum: [200, 201] })
  statusCode: number;

  @ApiProperty({ type: CompanyResponse })
  data: CompanyResponse;
}

export class CompaniesPageApiResponse {
  @ApiProperty({ enum: [true] })
  success: true;

  @ApiProperty({ type: 'integer', enum: [200] })
  statusCode: number;

  @ApiProperty({ type: CompaniesPageResponse })
  data: CompaniesPageResponse;
}

export class CompanyApiErrorResponse {
  @ApiProperty({ enum: [false] })
  success: false;

  @ApiProperty({ type: 'integer' })
  statusCode: number;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message: string | string[];

  @ApiProperty({ description: 'Error label or business conflict code', example: 'STALE_VERSION' })
  error: string;
}
