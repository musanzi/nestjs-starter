import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { logHandlerError } from '@/shared/helpers';
import { WelcomeUserEvent } from '../../events';
import { SignUpCommand } from '../impl/sign-up.command';
import { FindUserByEmailQuery, FindUserByIdQuery } from '@/modules/users/queries';
import { CreateUserCommand } from '@/modules/users/commands';

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, UserResponse> {
  private readonly logger = new Logger(SignUpHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: SignUpCommand): Promise<UserResponse> {
    const { dto } = command;

    try {
      const existingUser = await this.queryBus.execute(new FindUserByEmailQuery(dto.email));
      if (existingUser) {
        throw new ConflictException('Cet utilisateur existe déjà');
      }
      const savedUser = await this.commandBus.execute(new CreateUserCommand(dto));
      this.eventBus.publish(new WelcomeUserEvent(savedUser));
      return await this.queryBus.execute(new FindUserByIdQuery(savedUser.id));
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Sign up', error, `email="${dto.email}"`);
      throw new BadRequestException(error['message'] ?? 'Inscription impossible');
    }
  }
}
