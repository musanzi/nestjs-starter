import { User } from '@/modules/users/entities/user.entity';

export class ProfileQuery {
  constructor(public readonly currentUser: User) {}
}
