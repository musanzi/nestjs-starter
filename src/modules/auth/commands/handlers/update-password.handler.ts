import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { UpdateUserCommand } from '@/modules/users/commands';
import { logHandlerError } from '@/shared/helpers';
import { UpdatePasswordCommand } from '../impl/update-password.command';
import { FindUserByEmailQuery } from '@/modules/users/queries';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler implements ICommandHandler<UpdatePasswordCommand, IUserResponse> {
  private readonly logger = new Logger(UpdatePasswordHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<IUserResponse> {
    const { currentUser, dto } = command;

    try {
      await this.commandBus.execute(new UpdateUserCommand(currentUser.id, { password: dto.password }));

      return await this.queryBus.execute(new FindUserByEmailQuery(currentUser.email));
    } catch (error) {
      logHandlerError(this.logger, 'Update password', error, `id="${currentUser?.id ?? ''}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
