import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { SignUpCommand } from '../impl';
import { FindUserByIdQuery } from '@/modules/users/queries';
import { CreateUserCommand } from '@/modules/users/commands';

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, IUserResponse> {
  private readonly logger = new Logger(SignUpHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: SignUpCommand): Promise<IUserResponse> {
    const { dto } = command;

    try {
      const user = await this.commandBus.execute(new CreateUserCommand(dto));

      return await this.queryBus.execute(new FindUserByIdQuery(user.id));
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      this.logger.error(
        `Sign up failed email="${dto.email}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException(error['message'] ?? 'Inscription impossible');
    }
  }
}
