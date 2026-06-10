import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logHandlerError } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleQuery } from '../impl/find-role.query';

@QueryHandler(FindRoleQuery)
export class FindRoleHandler implements IQueryHandler<FindRoleQuery, Role> {
  private readonly logger = new Logger(FindRoleHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindRoleQuery): Promise<Role> {
    try {
      return await this.repository.findOneOrFail({
        ...query.options,
        where: query.where
      });
    } catch (error) {
      logHandlerError(this.logger, 'Find role', error, `where="${JSON.stringify(query.where)}"`);
      throw new NotFoundException('Rôle introuvable');
    }
  }
}
