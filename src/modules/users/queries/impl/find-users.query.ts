import { IFilterUsers } from '../../interfaces/filter-users.interface';

export class FindUsersQuery {
  constructor(public readonly params: IFilterUsers) {}
}
