import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { logHandlerError } from '@/shared/helpers';
import { UserResponse } from '../../interfaces';
import { FindUserByEmailQuery } from '../../queries';
import { FindOrCreateUserCommand } from '../impl/find-or-create-user.command';
import { UpdateUserCommand } from '../impl/update-user.command';
import { CreateUserCommand } from '../impl/create-user.command';

@CommandHandler(FindOrCreateUserCommand)
export class FindOrCreateUserHandler implements ICommandHandler<FindOrCreateUserCommand, UserResponse> {
  private readonly logger = new Logger(FindOrCreateUserHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: FindOrCreateUserCommand): Promise<UserResponse> {
    const { dto } = command;

    try {
      try {
        const existingUser = await this.queryBus.execute(new FindUserByEmailQuery(dto.email));
        return this.commandBus.execute(new UpdateUserCommand(existingUser.id, dto));
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
      }

      return await this.commandBus.execute(new CreateUserCommand(dto));
    } catch (error) {
      logHandlerError(this.logger, 'Find or create user', error, `email="${dto.email}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
