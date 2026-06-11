import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { parseUsersCsv } from '../../helpers/user-csv.helper';
import { logHandlerError } from '@/shared/helpers';
import { FindOrCreateUserCommand, ImportUsersCsvCommand } from '../impl';

@CommandHandler(ImportUsersCsvCommand)
export class ImportUsersCsvHandler implements ICommandHandler<ImportUsersCsvCommand, void> {
  private readonly logger = new Logger(ImportUsersCsvHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: ImportUsersCsvCommand): Promise<void> {
    try {
      const rows = await parseUsersCsv(command.file.buffer);

      for (const row of rows) {
        await this.commandBus.execute(new FindOrCreateUserCommand(row));
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Import users csv', error);
      throw new BadRequestException('Import des utilisateurs impossible');
    }
  }
}
