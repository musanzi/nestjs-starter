import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import { assertManualCompanyVersion, validateCompanyId, validateExpectedVersion } from '../../helpers';

import { ArchiveCompany } from '../impl';

@CommandHandler(ArchiveCompany)
export class ArchiveCompanyHandler implements ICommandHandler<ArchiveCompany, void> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(command: ArchiveCompany): Promise<void> {
    const { id, archiveCompanyDto: dto } = command;
    validateCompanyId(id);
    validateExpectedVersion(dto?.expectedVersion);

    return this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Company);
      // Serialize version checks and writes, including no-op updates and archival races.
      const company = await repository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' }
      });
      if (!company) throw new NotFoundException('Company not found');
      assertManualCompanyVersion(company, dto.expectedVersion);
      company.deletedAt = new Date();
      company.version += 1;
      await repository.save(company);
    });
  }
}
