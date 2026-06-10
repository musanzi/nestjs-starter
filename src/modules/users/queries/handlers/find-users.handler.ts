import { BadRequestException, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUsersRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { IUserResponse } from '../../interfaces';
import { logHandlerError, parsePaginationParams } from '@/shared/helpers';
import { FindUsersQuery } from '../impl/find-users.query';

@QueryHandler(FindUsersQuery)
export class FindUsersHandler implements IQueryHandler<FindUsersQuery, [IUserResponse[], number]> {
  private readonly logger = new Logger(FindUsersHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUsersQuery): Promise<[IUserResponse[], number]> {
    try {
      const { q } = query.params;
      const { pageNumber, limitNumber } = parsePaginationParams(query.params);

      if (Object.keys(query.params).length === 0) {
        const users = await this.repository.findAndCount({
          order: { updatedAt: 'DESC' }
        });
        return [mapUsersRoles(users[0]), users[1]];
      }

      const queryBuilder = this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .orderBy('user.updatedAt', 'DESC');
      if (q) queryBuilder.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });

      const [users, total] = await queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber)
        .getManyAndCount();
      return [mapUsersRoles(users), total];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      logHandlerError(this.logger, 'Find users', error, `options="${JSON.stringify(query.params)}"`);
      throw new BadRequestException('Utilisateurs introuvables');
    }
  }
}
