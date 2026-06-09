import { BadRequestException, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logHandlerError, parsePaginationParams } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindPaginatedRolesQuery } from '../impl/find-paginated-roles.query';

@QueryHandler(FindPaginatedRolesQuery)
export class FindPaginatedRolesHandler implements IQueryHandler<FindPaginatedRolesQuery, [Role[], number]> {
  private readonly logger = new Logger(FindPaginatedRolesHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindPaginatedRolesQuery): Promise<[Role[], number]> {
    const { page = 1, limit, take, q } = query.params;

    try {
      const { pageNumber, limitNumber } = parsePaginationParams(query.params);

      const queryBuilder = this.repository.createQueryBuilder('role').orderBy('role.updated_at', 'DESC');
      if (q) queryBuilder.where('role.name LIKE :name', { name: `%${q}%` });

      return await queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber)
        .getManyAndCount();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      logHandlerError(this.logger, 'Find paginated roles', error, `page="${page}" limit="${limit ?? take ?? ''}" q="${q ?? ''}"`);
      throw new BadRequestException('Rôles introuvables');
    }
  }
}
