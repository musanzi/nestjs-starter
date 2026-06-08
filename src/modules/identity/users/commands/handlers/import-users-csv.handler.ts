import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@/modules/identity/roles/entities/role.entity';
import { parseUsersCsv } from '../../helpers/user-csv.helper';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { ImportUsersCsvCommand } from '../impl/import-users-csv.command';

@CommandHandler(ImportUsersCsvCommand)
export class ImportUsersCsvHandler implements ICommandHandler<ImportUsersCsvCommand, void> {
  private readonly logger = new Logger(ImportUsersCsvHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async execute(command: ImportUsersCsvCommand): Promise<void> {
    try {
      const rows = await parseUsersCsv(command.file.buffer);
      const defaultRole = await this.roleRepository.findOne({ where: { name: 'user' } });
      if (!defaultRole) {
        throw new NotFoundException('Rôle introuvable');
      }

      for (const row of rows) {
        const existingUser = await this.userRepository.findOne({ where: { email: row.email } });
        if (existingUser) continue;

        const user = this.userRepository.create({
          ...row,
          roles: [{ id: defaultRole.id }]
        });
        await this.userRepository.save(user);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Import users csv', error);
      throw new BadRequestException('Import des utilisateurs impossible');
    }
  }
}
