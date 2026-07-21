import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';

export class UpdatePassword extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly password: string
  ) {
    super();
  }
}
