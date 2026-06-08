import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { UpdateUserCommand } from '@/modules/users/commands';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { logHandlerError } from '@/shared/helpers';
import { UpdatePasswordCommand } from '../impl/update-password.command';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler implements ICommandHandler<UpdatePasswordCommand, User> {
  private readonly logger = new Logger(UpdatePasswordHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<User> {
    try {
      await this.commandBus.execute(new UpdateUserCommand(command.currentUser.id, { password: command.dto.password }));
      return await this.queryBus.execute(new FindUserByEmailQuery(command.currentUser.email));
    } catch (error) {
      logHandlerError(this.logger, 'Update password', error, `id="${command.currentUser?.id ?? ''}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
