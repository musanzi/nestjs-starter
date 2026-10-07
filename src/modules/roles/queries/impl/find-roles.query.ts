import { Query } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';
import { FilterRolesDto } from '../../dto';

export class FindRoles extends Query<[Role[], number]> {
  constructor(public readonly params: FilterRolesDto = {}) {
    super();
  }
}
