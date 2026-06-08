import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { User } from '@/modules/identity/users/entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { UpdateProfileCommand } from '../impl/update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, User> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(private readonly usersService: UsersService) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    try {
      return await this.usersService.update(command.currentUser.id, command.dto);
    } catch (error) {
      logHandlerError(this.logger, 'Update profile', error, `id="${command.currentUser?.id ?? ''}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
