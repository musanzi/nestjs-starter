import { User } from '@/modules/identity/users/entities/user.entity';

export class ProfileQuery {
  constructor(public readonly currentUser: User) {}
}
