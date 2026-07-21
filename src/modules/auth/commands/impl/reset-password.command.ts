import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';

export class ResetPassword extends Command<IUserResponse> {
  constructor(public readonly data: { token: string; password: string }) {
    super();
  }
}
