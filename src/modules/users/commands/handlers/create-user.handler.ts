import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { CreateUserCommand } from '../impl/create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserResponse> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    try {
      const user = this.repository.create({
        ...command.dto,
        password: 'user1234',
        roles: mapRoleIds(command.dto.roles)
      });
      const createdUser = await this.repository.save(user);
      return await this.queryBus.execute(new FindUserByIdQuery(createdUser.id));
    } catch (error) {
      logHandlerError(this.logger, 'Create user', error, `email="${command.dto.email}"`);
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }
}
