import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import { CompanySource } from '../../enums';
import { mapCompany, normalizeCompanyText } from '../../helpers';
import { ICompanyResponse } from '../../interfaces';
import { CreateCompany } from '../impl';

@CommandHandler(CreateCompany)
export class CreateCompanyHandler implements ICommandHandler<CreateCompany, ICompanyResponse> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(command: CreateCompany): Promise<ICompanyResponse> {
    const company = this.repository.create({
      name: normalizeCompanyText(command.createCompanyDto?.name, 'name', 255),
      source: CompanySource.MANUAL,
      odooInstanceId: null,
      odooModel: null,
      odooRecordId: null,
      version: 1
    });
    return mapCompany(await this.repository.save(company));
  }
}
