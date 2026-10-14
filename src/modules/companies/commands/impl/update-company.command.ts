import { Command } from '@nestjs/cqrs';
import { UpdateCompanyDto } from '../../dto';
import { ICompanyResponse } from '../../interfaces';

export class UpdateCompany extends Command<ICompanyResponse> {
  constructor(
    public readonly id: string,
    public readonly updateCompanyDto: UpdateCompanyDto
  ) {
    super();
  }
}
