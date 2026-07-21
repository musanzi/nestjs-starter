import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';

export class SignUp extends Command<IUserResponse> {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string
  ) {
    super();
  }
}
