import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import { mapCompany, validateCompanyId } from '../../helpers';
import { ICompanyResponse } from '../../interfaces';
import { FindCompanyById } from '../impl';

@QueryHandler(FindCompanyById)
export class FindCompanyByIdHandler implements IQueryHandler<FindCompanyById, ICompanyResponse> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(query: FindCompanyById): Promise<ICompanyResponse> {
    validateCompanyId(query.id);
    const company = await this.repository.findOne({ where: { id: query.id } });
    if (!company) throw new NotFoundException('Company not found');
    return mapCompany(company);
  }
}
