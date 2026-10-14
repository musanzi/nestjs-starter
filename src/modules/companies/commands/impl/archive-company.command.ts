import { Command } from '@nestjs/cqrs';
import { ArchiveCompanyDto } from '../../dto';

export class ArchiveCompany extends Command<void> {
  constructor(
    public readonly id: string,
    public readonly archiveCompanyDto: ArchiveCompanyDto
  ) {
    super();
  }
}
