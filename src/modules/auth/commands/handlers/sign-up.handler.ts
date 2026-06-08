import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { User } from '@/modules/identity/users/entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { SignUpCommand } from '../impl/sign-up.command';

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, User> {
  private readonly logger = new Logger(SignUpHandler.name);

  constructor(private readonly usersService: UsersService) {}

  async execute(command: SignUpCommand): Promise<User> {
    try {
      return await this.usersService.signUp(command.dto);
    } catch (error) {
      logHandlerError(this.logger, 'Sign up', error, `email="${command.dto.email}"`);
      throw new BadRequestException(error['message']);
    }
  }
}
