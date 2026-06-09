import { Query } from '@nestjs/cqrs';
import { IFilterUsers } from '../../interfaces/filter-users.interface';
import { IUserResponse } from '../../interfaces';

export class FindUsersQuery extends Query<[IUserResponse[], number]> {
  constructor(public readonly params: IFilterUsers) {
    super();
  }
}
