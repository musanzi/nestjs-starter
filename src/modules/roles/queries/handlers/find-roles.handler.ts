import { BadRequestException, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logHandlerError, parsePaginationParams } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRolesQuery } from '../impl/find-roles.query';

@QueryHandler(FindRolesQuery)
export class FindRolesHandler implements IQueryHandler<FindRolesQuery, [Role[], number]> {
  private readonly logger = new Logger(FindRolesHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindRolesQuery): Promise<[Role[], number]> {
    const { q } = query.params;

    try {
      if (Object.keys(query.params).length === 0) {
        return await this.repository.findAndCount({
          order: { updated_at: 'DESC' }
        });
      }

      const { pageNumber, limitNumber } = parsePaginationParams(query.params);
      const queryBuilder = this.repository.createQueryBuilder('role').orderBy('role.updated_at', 'DESC');
      if (q) queryBuilder.where('role.name LIKE :name', { name: `%${q}%` });

      return await queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber)
        .getManyAndCount();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      logHandlerError(
        this.logger,
        'Find roles',
        error,
        `page="${query.params.page ?? ''}" limit="${query.params.limit ?? query.params.take ?? ''}" q="${q ?? ''}"`
      );
      throw new BadRequestException('Rôles introuvables');
    }
  }
}
