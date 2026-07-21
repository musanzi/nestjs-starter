import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';

export class SignUp extends Command<IUserResponse> {
  constructor(public readonly data: { name: string; email: string; password: string }) {
    super();
  }
}
