import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUserRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { FindUserByEmailQuery } from '../impl/find-user-by-email.query';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery, User> {
  private readonly logger = new Logger(FindUserByEmailHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByEmailQuery): Promise<User> {
    try {
      const user = await this.repository.findOne({
        where: { email: query.email },
        relations: ['roles']
      });
      if (!user) {
        throw new NotFoundException("Cet utilisateur n'existe pas");
      }

      return mapUserRoles(user);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logHandlerError(this.logger, 'Find user by email', error, `email="${query.email}"`);
      throw new BadRequestException('Recherche de l’utilisateur impossible');
    }
  }
}
