import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { User } from '@/modules/identity/users/entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { UpdatePasswordCommand } from '../impl/update-password.command';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler implements ICommandHandler<UpdatePasswordCommand, User> {
  private readonly logger = new Logger(UpdatePasswordHandler.name);

  constructor(private readonly usersService: UsersService) {}

  async execute(command: UpdatePasswordCommand): Promise<User> {
    try {
      await this.usersService.update(command.currentUser.id, { password: command.dto.password });
      return await this.usersService.findByEmail(command.currentUser.email);
    } catch (error) {
      logHandlerError(this.logger, 'Update password', error, `id="${command.currentUser?.id ?? ''}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
