import { BadRequestException, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mapUsersRoles } from '../../common/user-mappers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { logHandlerError } from '@/shared/helpers';
import { FindUsersQuery } from '../impl/find-users.query';

@QueryHandler(FindUsersQuery)
export class FindUsersHandler implements IQueryHandler<FindUsersQuery, [UserResponse[], number]> {
  private readonly logger = new Logger(FindUsersHandler.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async execute(query: FindUsersQuery): Promise<[UserResponse[], number]> {
    const { page = 1, q } = query.params;

    try {
      const pageNumber = Number(page);
      const takeNumber = 50;
      if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new BadRequestException('Les paramètres de pagination sont invalides');
      }

      const queryBuilder = this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .orderBy('user.updated_at', 'DESC');
      if (q) queryBuilder.where('user.name LIKE :q OR user.email LIKE :q', { q: `%${q}%` });

      const [users, total] = await queryBuilder
        .skip((pageNumber - 1) * takeNumber)
        .take(takeNumber)
        .getManyAndCount();
      return [mapUsersRoles(users), total];
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      logHandlerError(this.logger, 'Find users', error, `page="${page}" q="${q ?? ''}"`);
      throw new BadRequestException('Utilisateurs introuvables');
    }
  }
}
