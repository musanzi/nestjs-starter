import { Command } from '@nestjs/cqrs';
import { CreateCompanyDto } from '../../dto';
import { ICompanyResponse } from '../../interfaces';

export class CreateCompany extends Command<ICompanyResponse> {
  constructor(public readonly createCompanyDto: CreateCompanyDto) {
    super();
  }
}
