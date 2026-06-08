import { Query } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { UserResponse } from '@/modules/users/interfaces';

export class ProfileQuery extends Query<UserResponse> {
  constructor(public readonly currentUser: User) {
    super();
  }
}
