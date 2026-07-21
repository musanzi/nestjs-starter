import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '../../interfaces';

export class FindOrCreateUser extends Command<IUserResponse> {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly password?: string,
    public readonly avatar?: string,
    public readonly roles?: string[]
  ) {
    super();
  }
}
