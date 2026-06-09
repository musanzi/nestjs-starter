import { Query } from '@nestjs/cqrs';
import { FindOptionsWhere } from 'typeorm';
import { Role } from '../../entities/role.entity';

export class FindRoleQuery extends Query<Role> {
  constructor(public readonly where: FindOptionsWhere<Role>) {
    super();
  }
}
