import { Query } from '@nestjs/cqrs';
import { Role } from '../../entities/role.entity';

export class FindAllRolesQuery extends Query<Role[]> {}
