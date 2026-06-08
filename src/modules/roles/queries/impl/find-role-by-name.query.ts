import { Query } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';

export class FindRoleByNameQuery extends Query<Role> {
  constructor(public readonly name: string) {
    super();
  }
}
