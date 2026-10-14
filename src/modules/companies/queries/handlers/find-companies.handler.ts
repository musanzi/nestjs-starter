import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parsePaginationParams } from '@/shared/helpers';
import { Company } from '../../entities';
import { mapCompany } from '../../helpers';
import { ICompaniesPage } from '../../interfaces';
import { FindCompanies } from '../impl';

@QueryHandler(FindCompanies)
export class FindCompaniesHandler implements IQueryHandler<FindCompanies, ICompaniesPage> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(query: FindCompanies): Promise<ICompaniesPage> {
    const { pageNumber: page, limitNumber: limit } = parsePaginationParams(query.params);
    const { q, source } = query.params;
    const builder = this.repository
      .createQueryBuilder('company')
      .orderBy('company.createdAt', 'DESC')
      .addOrderBy('company.id', 'DESC');
    if (source) builder.andWhere('company.source = :source', { source });
    if (q) {
      // Treat wildcard characters as literal substring characters, not SQL patterns.
      const escaped = q.replace(/[!%_]/g, '!$&');
      builder.andWhere("company.name ILIKE :name ESCAPE '!'", { name: `%${escaped}%` });
    }
    const [items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items: items.map(mapCompany), total, page, limit };
  }
}
