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
    try {
      const { q } = query.params;

      if (Object.keys(query.params).length === 0) {
        return await this.repository.findAndCount({
          order: { updatedAt: 'DESC' }
        });
      }

      const { pageNumber, limitNumber } = parsePaginationParams(query.params);
      const queryBuilder = this.repository.createQueryBuilder('role').orderBy('role.updatedAt', 'DESC');
      if (q) queryBuilder.where('role.name LIKE :name', { name: `%${q}%` });

      return await queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber)
        .getManyAndCount();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      logHandlerError(this.logger, 'Find roles', error, `params="${JSON.stringify(query.params)}"`);
      throw new BadRequestException('Rôles introuvables');
    }
  }
}
