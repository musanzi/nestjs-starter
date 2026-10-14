import { CompanySource } from '../enums';

export interface ICompanyExternalIdentity {
  odooInstanceId: string;
  odooModel: string;
  odooRecordId: string;
}

export interface IUpsertOdooCompany extends ICompanyExternalIdentity {
  name: string;
}

export interface ICompanyResponse {
  id: string;
  name: string;
  source: CompanySource;
  odooInstanceId: string | null;
  odooModel: string | null;
  odooRecordId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompaniesPage {
  items: ICompanyResponse[];
  total: number;
  page: number;
  limit: number;
}
