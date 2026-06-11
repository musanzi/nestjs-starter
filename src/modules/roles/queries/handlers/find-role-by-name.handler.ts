import { Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logHandlerError } from '@/shared/helpers';
import { Role } from '../../entities/role.entity';
import { FindRoleByNameQuery } from '../impl';

@QueryHandler(FindRoleByNameQuery)
export class FindRoleByNameHandler implements IQueryHandler<FindRoleByNameQuery, Role> {
  private readonly logger = new Logger(FindRoleByNameHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindRoleByNameQuery): Promise<Role> {
    try {
      return await this.repository.findOneOrFail({
        where: { name: query.name }
      });
    } catch (error) {
      logHandlerError(this.logger, 'Find role by name', error, `name="${query.name}"`);
      throw new NotFoundException('Rôle introuvable');
    }
  }
}
