import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { parseUsersCsv } from '../../helpers/user-csv.helper';
import { FindUserByEmailQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { ImportUsersCsvCommand } from '../impl/import-users-csv.command';
import { CreateUserCommand } from '../impl/create-user.command';

@CommandHandler(ImportUsersCsvCommand)
export class ImportUsersCsvHandler implements ICommandHandler<ImportUsersCsvCommand, void> {
  private readonly logger = new Logger(ImportUsersCsvHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: ImportUsersCsvCommand): Promise<void> {
    try {
      const rows = await parseUsersCsv(command.file.buffer);

      for (const row of rows) {
        try {
          await this.queryBus.execute(new FindUserByEmailQuery(row.email));
          continue;
        } catch (error) {
          if (!(error instanceof NotFoundException)) throw error;
        }

        await this.commandBus.execute(new CreateUserCommand(row));
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Import users csv', error);
      throw new BadRequestException('Import des utilisateurs impossible');
    }
  }
}
