import { Query } from '@nestjs/cqrs';
import { ICompanyResponse } from '../../interfaces';

export class FindCompanyById extends Query<ICompanyResponse> {
  constructor(public readonly id: string) {
    super();
  }
}
