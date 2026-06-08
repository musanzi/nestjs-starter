import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logRoleHandlerError } from '../../common/log-role-handler-error';
import { Role } from '../../entities/role.entity';
import { FindRoleByNameQuery } from '../impl/find-role-by-name.query';

@QueryHandler(FindRoleByNameQuery)
export class FindRoleByNameHandler implements IQueryHandler<FindRoleByNameQuery, Role> {
  private readonly logger = new Logger(FindRoleByNameHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(query: FindRoleByNameQuery): Promise<Role> {
    try {
      const role = await this.repository.findOne({ where: { name: query.name } });
      if (!role) {
        throw new NotFoundException('Rôle introuvable');
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      logRoleHandlerError(this.logger, 'Find role by name', error, `name="${query.name}"`);
      throw new BadRequestException('Recherche du rôle impossible');
    }
  }
}
