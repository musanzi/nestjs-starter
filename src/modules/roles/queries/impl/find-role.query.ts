import { Query } from '@nestjs/cqrs';
import { FindOneOptions } from 'typeorm';
import { Role } from '../../entities/role.entity';

export class FindRoleQuery extends Query<Role> {
  constructor(public readonly options: FindOneOptions<Role>) {
    super();
  }
}
