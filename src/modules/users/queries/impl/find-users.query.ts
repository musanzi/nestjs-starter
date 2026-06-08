import { Query } from '@nestjs/cqrs';
import { IFilterUsers } from '../../interfaces/filter-users.interface';
import { UserResponse } from '../../interfaces';

export class FindUsersQuery extends Query<[UserResponse[], number]> {
  constructor(public readonly params: IFilterUsers) {
    super();
  }
}
