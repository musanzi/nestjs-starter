import { IFilterRoles } from '../../interfaces/filter-roles.interface';

export class FindPaginatedRolesQuery {
  constructor(public readonly params: IFilterRoles) {}
}
