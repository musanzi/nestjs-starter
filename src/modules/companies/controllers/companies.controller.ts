import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse
} from '@nestjs/swagger';
import { AbstractController } from '@/shared/abstracts';
import { HasRoles } from '@/modules/auth/decorators';
import { Roles } from '@/modules/auth/enums';
import { ArchiveCompany, CreateCompany, UpdateCompany } from '../commands';
import { FindCompanies, FindCompanyById } from '../queries';
import {
  ArchiveCompanyDto,
  CompaniesPageApiResponse,
  CompanyApiErrorResponse,
  CompanyApiResponse,
  CreateCompanyDto,
  FilterCompaniesDto,
  UpdateCompanyDto
} from '../dto';
import { ICompaniesPage, ICompanyResponse } from '../interfaces';

@ApiTags('companies')
@HasRoles([Roles.ADMIN])
@Controller('api/v1/admin/companies')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@ApiBadRequestResponse({
  type: CompanyApiErrorResponse,
  description: 'Invalid UUID, body, filters, pagination, or unknown fields'
})
@ApiUnprocessableEntityResponse({ type: CompanyApiErrorResponse, description: 'Invalid business input' })
@ApiForbiddenResponse({
  type: CompanyApiErrorResponse,
  description: 'Missing authenticated session or ADMIN role (existing global guards)'
})
export class CompaniesController extends AbstractController {
  @Post()
  @ApiOperation({ summary: 'Create a manual company (admin session required)' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiCreatedResponse({ type: CompanyApiResponse, description: 'Manual company created' })
  create(@Body() dto: CreateCompanyDto): Promise<ICompanyResponse> {
    return this.commandHandler.execute(new CreateCompany(dto));
  }

  @Get()
  @ApiOperation({ summary: 'List active companies with pagination (admin only)' })
  @ApiOkResponse({
    type: CompaniesPageApiResponse,
    description: 'Paginated companies in the standard API data envelope'
  })
  findAll(@Query() query: FilterCompaniesDto): Promise<ICompaniesPage> {
    return this.queryHandler.execute(new FindCompanies(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an active company (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CompanyApiResponse })
  @ApiNotFoundResponse({ type: CompanyApiErrorResponse, description: 'Company missing or archived' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ICompanyResponse> {
    return this.queryHandler.execute(new FindCompanyById(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a manual company with a version check (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({ type: CompanyApiResponse })
  @ApiNotFoundResponse({ type: CompanyApiErrorResponse })
  @ApiConflictResponse({ type: CompanyApiErrorResponse, description: 'error: STALE_VERSION or ODOO_MANAGED_COMPANY' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCompanyDto): Promise<ICompanyResponse> {
    return this.commandHandler.execute(new UpdateCompany(id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a manual company with a version check (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ArchiveCompanyDto })
  @ApiNoContentResponse({ description: 'Company archived; no response body' })
  @ApiNotFoundResponse({ type: CompanyApiErrorResponse })
  @ApiConflictResponse({ type: CompanyApiErrorResponse, description: 'error: STALE_VERSION or ODOO_MANAGED_COMPANY' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: ArchiveCompanyDto): Promise<void> {
    return this.commandHandler.execute(new ArchiveCompany(id, dto));
  }
}
