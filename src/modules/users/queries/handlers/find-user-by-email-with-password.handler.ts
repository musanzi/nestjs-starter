import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { FindUserByEmailWithPasswordQuery } from '../impl/find-user-by-email-with-password.query';

@QueryHandler(FindUserByEmailWithPasswordQuery)
export class FindUserByEmailWithPasswordHandler implements IQueryHandler<FindUserByEmailWithPasswordQuery, User> {
  private readonly logger = new Logger(FindUserByEmailWithPasswordHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByEmailWithPasswordQuery): Promise<User> {
    try {
      return await this.repository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .leftJoinAndSelect('user.roles', 'roles')
        .where('user.email = :email', { email: query.email })
        .getOneOrFail();
    } catch (error) {
      logHandlerError(this.logger, 'Find user by email with password', error, `email="${query.email}"`);
      throw new NotFoundException("Cet utilisateur n'existe pas");
    }
  }
}
