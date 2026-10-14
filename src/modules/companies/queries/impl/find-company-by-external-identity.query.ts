import { Query } from '@nestjs/cqrs';
import { ICompanyResponse, ICompanyExternalIdentity } from '../../interfaces';

export class FindCompanyByExternalIdentity extends Query<ICompanyResponse> {
  constructor(public readonly identity: ICompanyExternalIdentity) {
    super();
  }
}
