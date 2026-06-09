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
import { FindRoleByNameQuery } from '@/modules/roles/queries';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, UserResponse> {
  private readonly logger = new Logger(CreateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponse> {
    const { roles, ...dto } = command.dto;

    try {
      const defaultRole = await this.queryBus.execute(new FindRoleByNameQuery('user'));
      const user = this.repository.create({
        ...dto,
        password: 'user1234',
        roles: roles ? mapRoleIds(roles) : [defaultRole]
      });
      const createdUser = await this.repository.save(user);
      return await this.queryBus.execute(new FindUserByIdQuery(createdUser.id));
    } catch (error) {
      logHandlerError(this.logger, 'Create user', error, `email="${dto.email}"`);
      throw new BadRequestException("Création de l'utilisateur impossible");
    }
  }
}
