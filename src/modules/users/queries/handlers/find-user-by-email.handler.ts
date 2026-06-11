import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { logHandlerError } from '@/shared/helpers';
import { FindUserByEmailQuery } from '../impl';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery, IUserResponse> {
  private readonly logger = new Logger(FindUserByEmailHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByEmailQuery): Promise<IUserResponse> {
    try {
      const user = await this.repository.findOneOrFail({
        where: { email: query.email },
        relations: ['roles']
      });
      return mapUserRoles(user);
    } catch (error) {
      logHandlerError(this.logger, 'Find user by email', error, `email="${query.email}"`);
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
