import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logHandlerError } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleByIdQuery } from '../impl/find-role-by-id.query';

@QueryHandler(FindRoleByIdQuery)
export class FindRoleByIdHandler implements IQueryHandler<FindRoleByIdQuery, Role> {
  private readonly logger = new Logger(FindRoleByIdHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindRoleByIdQuery): Promise<Role> {
    try {
      return await this.repository.findOneOrFail({
        where: { id: query.id }
      });
    } catch (error) {
      logHandlerError(this.logger, 'Find role by id', error, `id="${query.id}"`);
      throw new NotFoundException('Rôle introuvable');
    }
  }
}
