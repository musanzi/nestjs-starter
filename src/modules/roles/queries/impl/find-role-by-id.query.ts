import { Query } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';

export class FindRoleByIdQuery extends Query<Role> {
  constructor(public readonly id: string) {
    super();
  }
}
