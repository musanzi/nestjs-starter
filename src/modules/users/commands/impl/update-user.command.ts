import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '../../interfaces';

export class UpdateUser extends Command<IUserResponse> {
  constructor(
    public readonly id: string,
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
