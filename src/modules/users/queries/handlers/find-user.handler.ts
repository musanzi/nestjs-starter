import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { logHandlerError } from '@/shared/helpers';
import { FindUserQuery } from '../impl/find-user.query';

@QueryHandler(FindUserQuery)
export class FindUserHandler implements IQueryHandler<FindUserQuery, UserResponse> {
  private readonly logger = new Logger(FindUserHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserQuery): Promise<UserResponse> {
    try {
      const user = await this.repository.findOneOrFail({
        ...query.options,
        relations: ['roles']
      });
      return mapUserRoles(user);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Find user by id', error, `options="${query.options}"`);
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
