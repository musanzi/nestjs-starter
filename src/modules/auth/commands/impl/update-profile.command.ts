import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';

export class UpdateProfile extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly data: {
      email?: string;
      name?: string;
      password?: string;
      avatar?: string;
      roles?: string[];
    }
  ) {
    super();
  }
}
