import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { UpdateUserCommand } from '@/modules/users/commands';
import { logHandlerError } from '@/shared/helpers';
import { UpdateProfileCommand } from '../impl/update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, IUserResponse> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: UpdateProfileCommand): Promise<IUserResponse> {
    const { dto, currentUser } = command;

    try {
      return await this.commandBus.execute(new UpdateUserCommand(currentUser.id, dto));
    } catch (error) {
      logHandlerError(this.logger, 'Update profile', error, `id="${currentUser?.id ?? ''}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
