import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';

export class UpdateProfile extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly email?: string,
    public readonly name?: string,
    public readonly password?: string,
    public readonly avatar?: string,
    public readonly roles?: string[]
  ) {
    super();
  }
}
