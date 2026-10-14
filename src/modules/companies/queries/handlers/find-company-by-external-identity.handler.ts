import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import { mapCompany, normalizeExternalIdentity } from '../../helpers';
import { ICompanyResponse } from '../../interfaces';
import { FindCompanyByExternalIdentity } from '../impl';

@QueryHandler(FindCompanyByExternalIdentity)
export class FindCompanyByExternalIdentityHandler implements IQueryHandler<
  FindCompanyByExternalIdentity,
  ICompanyResponse
> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(query: FindCompanyByExternalIdentity): Promise<ICompanyResponse> {
    const identity = normalizeExternalIdentity(query.identity);
    const company = await this.repository.findOne({ where: identity });
    if (!company) throw new NotFoundException('Company not found');
    return mapCompany(company);
  }
}
