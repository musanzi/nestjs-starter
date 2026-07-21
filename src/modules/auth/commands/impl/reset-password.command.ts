import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';

export class ResetPassword extends Command<IUserResponse> {
  constructor(
    public readonly token: string,
    public readonly password: string
  ) {
    super();
  }
}
