import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { logHandlerError } from '@/shared/helpers';
import { SignUpCommand } from '../impl/sign-up.command';
import { FindUserQuery } from '@/modules/users/queries';
import { CreateUserCommand } from '@/modules/users/commands';

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, UserResponse> {
  private readonly logger = new Logger(SignUpHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: SignUpCommand): Promise<UserResponse> {
    const { dto } = command;

    try {
      const user = await this.commandBus.execute(new CreateUserCommand(dto));

      return await this.queryBus.execute(
        new FindUserQuery({
          where: { id: user.id }
        })
      );
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      logHandlerError(this.logger, 'Sign up', error, `email="${dto.email}"`);
      throw new BadRequestException(error['message'] ?? 'Inscription impossible');
    }
  }
}
