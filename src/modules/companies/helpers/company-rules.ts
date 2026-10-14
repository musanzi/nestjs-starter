import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Company } from '../entities';
import { CompanySource } from '../enums';
import { ICompanyExternalIdentity, ICompanyResponse } from '../interfaces';

export function normalizeCompanyText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new UnprocessableEntityException(`${field} must be a nonempty string of at most ${max} characters`);
  }
  return value.trim();
}

export function normalizeExternalIdentity(input: ICompanyExternalIdentity): ICompanyExternalIdentity {
  return {
    odooInstanceId: normalizeCompanyText(input?.odooInstanceId, 'odooInstanceId', 128),
    odooModel: normalizeCompanyText(input?.odooModel, 'odooModel', 128),
    odooRecordId: normalizeCompanyText(input?.odooRecordId, 'odooRecordId', 128)
  };
}

export function validateCompanyId(id: string): void {
  if (!isUUID(id)) throw new UnprocessableEntityException('Invalid company UUID');
}

export function validateExpectedVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1 || version > 2147483647) {
    throw new UnprocessableEntityException('expectedVersion must be a positive 32-bit integer');
  }
}

export function companyConflict(code: string, message: string): never {
  // The global exception filter preserves `error`, but discards custom `code` fields.
  throw new ConflictException({ message, error: code });
}

export function assertManualCompanyVersion(company: Company, expectedVersion: number): void {
  if (company.source !== CompanySource.MANUAL) {
    companyConflict('ODOO_MANAGED_COMPANY', 'Odoo-managed companies cannot be changed through this endpoint');
  }
  if (company.version !== expectedVersion) {
    companyConflict('STALE_VERSION', 'Company has changed; reload it before retrying');
  }
}

export function mapCompany(company: Company): ICompanyResponse {
  return {
    id: company.id,
    name: company.name,
    source: company.source,
    odooInstanceId: company.odooInstanceId,
    odooModel: company.odooModel,
    odooRecordId: company.odooRecordId,
    version: company.version,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt
  };
}
