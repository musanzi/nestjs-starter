import { Command } from '@nestjs/cqrs';
import { ICompanyResponse, IUpsertOdooCompany } from '../../interfaces';

export class UpsertOdooCompany extends Command<ICompanyResponse> {
  constructor(public readonly input: IUpsertOdooCompany) {
    super();
  }
}
