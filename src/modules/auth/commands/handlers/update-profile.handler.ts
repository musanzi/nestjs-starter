import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { UpdateUserCommand } from '@/modules/users/commands';
import { UpdateProfileCommand } from '../impl';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand, IUserResponse> {
  private readonly logger = new Logger(UpdateProfileHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: UpdateProfileCommand): Promise<IUserResponse> {
    const { dto, currentUser } = command;

    try {
      return await this.commandBus.execute(new UpdateUserCommand(currentUser.id, dto));
    } catch (error) {
      this.logger.error(
        `Update profile failed id="${currentUser?.id ?? ''}": ${error instanceof Error ? error.message : String(error)}`
      );
      throw new BadRequestException('Requête invalide');
    }
  }
}
