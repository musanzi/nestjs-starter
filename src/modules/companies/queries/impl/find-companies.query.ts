import { Query } from '@nestjs/cqrs';
import { ICompaniesPage } from '../../interfaces';
import { FilterCompaniesDto } from '../../dto';

export class FindCompanies extends Query<ICompaniesPage> {
  constructor(public readonly params: FilterCompaniesDto) {
    super();
  }
}
