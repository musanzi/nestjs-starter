import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { logHandlerError } from '@/shared/helpers';
import { IUserResponse } from '../../interfaces';
import { CreateUserCommand, FindOrCreateUserCommand, UpdateUserCommand } from '../impl';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@CommandHandler(FindOrCreateUserCommand)
export class FindOrCreateUserHandler implements ICommandHandler<FindOrCreateUserCommand, IUserResponse> {
  private readonly logger = new Logger(FindOrCreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: FindOrCreateUserCommand): Promise<IUserResponse> {
    const { dto } = command;

    try {
      const existingUser = await this.repository.findOne({
        where: { email: dto.email },
        relations: ['roles']
      });

      if (existingUser) {
        if (existingUser.avatar) delete dto.avatar;
        return this.commandBus.execute(new UpdateUserCommand(existingUser.id, dto));
      }

      return await this.commandBus.execute(new CreateUserCommand(dto));
    } catch (error) {
      logHandlerError(this.logger, 'Find or create user', error, `email="${dto.email}"`);
      throw new BadRequestException('Requête invalide');
    }
  }
}
