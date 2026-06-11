import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { UpdateUserCommand } from '@/modules/users/commands';
import { UpdatePasswordCommand } from '../impl';
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
      this.logger.error(
        `Update password failed id="${currentUser?.id ?? ''}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
