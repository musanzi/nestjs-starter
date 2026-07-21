import { Query } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';

export class Profile extends Query<IUserResponse> {
  constructor(public readonly currentUser: User) {
    super();
  }
}
