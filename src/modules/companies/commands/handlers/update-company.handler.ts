import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import {
  assertManualCompanyVersion,
  validateCompanyId,
  validateExpectedVersion,
  mapCompany,
  normalizeCompanyText
} from '../../helpers';
import { ICompanyResponse } from '../../interfaces';
import { UpdateCompany } from '../impl';

@CommandHandler(UpdateCompany)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompany, ICompanyResponse> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(command: UpdateCompany): Promise<ICompanyResponse> {
    const { id, updateCompanyDto: dto } = command;
    validateCompanyId(id);
    validateExpectedVersion(dto?.expectedVersion);
    const name = normalizeCompanyText(dto?.name, 'name', 255);
    return this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Company);
      // Serialize version checks and writes, including no-op updates and archival races.
      const company = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' }
      });
      if (!company) throw new NotFoundException('Company not found');
      assertManualCompanyVersion(company, dto.expectedVersion);
      if (company.name === name) return mapCompany(company);
      company.name = name;
      company.version += 1;
      return mapCompany(await repository.save(company));
    });
  }
}
