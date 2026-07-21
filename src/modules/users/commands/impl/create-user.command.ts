import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '../../interfaces';

export class CreateUser extends Command<IUserResponse> {
  constructor(
    public readonly data: {
      email: string;
      name: string;
      password?: string;
      avatar?: string;
      roles?: string[];
    }
  ) {
    super();
  }
}
