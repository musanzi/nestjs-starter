import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { UpdateUserCommand } from '@/modules/users/commands';
import { logHandlerError } from '@/shared/helpers';
import { UpdateProfileCommand } from '../impl/update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, User> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    try {
      return await this.commandBus.execute(new UpdateUserCommand(command.currentUser.id, command.dto));
    } catch (error) {
      logHandlerError(this.logger, 'Update profile', error, `id="${command.currentUser?.id ?? ''}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
