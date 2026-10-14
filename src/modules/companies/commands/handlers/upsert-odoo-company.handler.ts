import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../entities';
import { CompanySource } from '../../enums';
import { companyConflict, mapCompany, normalizeCompanyText, normalizeExternalIdentity } from '../../helpers';
import { ICompanyResponse } from '../../interfaces';
import { UpsertOdooCompany } from '../impl';

@CommandHandler(UpsertOdooCompany)
export class UpsertOdooCompanyHandler implements ICommandHandler<UpsertOdooCompany, ICompanyResponse> {
  constructor(@InjectRepository(Company) private readonly repository: Repository<Company>) {}

  async execute(command: UpsertOdooCompany): Promise<ICompanyResponse> {
    const identity = normalizeExternalIdentity(command.input);
    const name = normalizeCompanyText(command.input?.name, 'name', 255);
    return this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Company);
      // Only this exact identity conflict is ignored. Other constraint/database errors propagate.
      // PostgreSQL waits for a concurrent insert before proceeding to the locked re-read.
      await repository
        .createQueryBuilder()
        .insert()
        .into(Company)
        .values({
          ...identity,
          name,
          source: CompanySource.ODOO,
          version: 1
        })
        // An empty overwrite list emits targeted ON CONFLICT ... DO NOTHING in TypeORM 1.1.
        .orUpdate([], ['odooInstanceId', 'odooModel', 'odooRecordId'])
        .execute();

      const company = await repository.findOneOrFail({
        where: identity,
        withDeleted: true,
        lock: { mode: 'pessimistic_write' }
      });
      if (company.deletedAt) companyConflict('COMPANY_ARCHIVED', 'Archived company requires reconciliation');
      if (company.name === name) return mapCompany(company);
      company.name = name;
      company.version += 1;
      return mapCompany(await repository.save(company));
    });
  }
}
