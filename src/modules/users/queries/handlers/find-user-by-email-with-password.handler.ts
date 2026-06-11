import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { FindUserByEmailWithPasswordQuery } from '../impl';

@QueryHandler(FindUserByEmailWithPasswordQuery)
export class FindUserByEmailWithPasswordHandler implements IQueryHandler<FindUserByEmailWithPasswordQuery, User> {
  private readonly logger = new Logger(FindUserByEmailWithPasswordHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUserByEmailWithPasswordQuery): Promise<User> {
    try {
      return await this.repository.findOneOrFail({
        where: { email: query.email },
        select: ['id', 'email', 'password']
      });
    } catch (error) {
      logHandlerError(this.logger, 'Find user by email with password', error, `email="${query.email}"`);
      throw new NotFoundException('Utilisateur introuvable');
    }
  }
}
