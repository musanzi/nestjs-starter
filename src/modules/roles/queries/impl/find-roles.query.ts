import { Query } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';
import { IFilterRoles } from '../../interfaces/filter-roles.interface';

export class FindRolesQuery extends Query<[Role[], number]> {
  constructor(public readonly params: IFilterRoles = {}) {
    super();
  }
}
