import { Query } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';

export class ProfileQuery extends Query<IUserResponse> {
  constructor(public readonly currentUser: User) {
    super();
  }
}
