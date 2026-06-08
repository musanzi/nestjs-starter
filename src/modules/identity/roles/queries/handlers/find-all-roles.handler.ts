import { BadRequestException, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { logRoleHandlerError } from '../../common/log-role-handler-error';
import { Role } from '../../entities/role.entity';
import { FindAllRolesQuery } from '../impl/find-all-roles.query';

@QueryHandler(FindAllRolesQuery)
export class FindAllRolesHandler implements IQueryHandler<FindAllRolesQuery, Role[]> {
  private readonly logger = new Logger(FindAllRolesHandler.name);

  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>
  ) {}

  async execute(): Promise<Role[]> {
    try {
      return await this.repository.find({
        order: { updated_at: 'DESC' }
      });
    } catch (error) {
      logRoleHandlerError(this.logger, 'Find all roles', error);
      throw new BadRequestException('Rôles introuvables');
    }
  }
}
