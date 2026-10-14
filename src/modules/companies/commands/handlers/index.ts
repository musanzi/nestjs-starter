import { CreateCompanyHandler } from './create-company.handler';
import { UpdateCompanyHandler } from './update-company.handler';
import { ArchiveCompanyHandler } from './archive-company.handler';
import { UpsertOdooCompanyHandler } from './upsert-odoo-company.handler';

export const CommandHandlers = [
  CreateCompanyHandler,
  UpdateCompanyHandler,
  ArchiveCompanyHandler,
  UpsertOdooCompanyHandler
];
