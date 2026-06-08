import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapRoleIds } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { logHandlerError } from '@/shared/helpers';
import { UpdateUserCommand } from '../impl/update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, UserResponse> {
  private readonly logger = new Logger(UpdateUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserResponse> {
    try {
      await this.queryBus.execute(new FindUserByIdQuery(command.id));

      const { roles, ...dto } = command.dto;
      await this.repository.save({
        id: command.id,
        ...dto,
        roles: roles ? mapRoleIds(roles) : undefined
      });
      return await this.queryBus.execute(new FindUserByIdQuery(command.id));
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Update user', error, `id="${command.id}"`);
      throw new BadRequestException('Mise à jour impossible');
    }
  }
}
