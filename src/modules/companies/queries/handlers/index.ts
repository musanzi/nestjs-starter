import { FindCompanyByIdHandler } from './find-company-by-id.handler';
import { FindCompanyByExternalIdentityHandler } from './find-company-by-external-identity.handler';
import { FindCompaniesHandler } from './find-companies.handler';

export const QueryHandlers = [FindCompanyByIdHandler, FindCompanyByExternalIdentityHandler, FindCompaniesHandler];
