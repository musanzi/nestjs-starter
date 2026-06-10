import { Query } from '@nestjs/cqrs';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { Role } from '../../entities/role.entity';

type FindRoleQueryOptions = Omit<FindOneOptions<Role>, 'where'>;

export class FindRoleQuery extends Query<Role> {
  constructor(
    public readonly where: FindOptionsWhere<Role>,
    public readonly options: FindRoleQueryOptions = {}
  ) {
    super();
  }
}
