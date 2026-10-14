import { IntersectionType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { ArchiveCompanyDto } from './archive-company.dto';

export class UpdateCompanyDto extends IntersectionType(CreateCompanyDto, ArchiveCompanyDto) {}
