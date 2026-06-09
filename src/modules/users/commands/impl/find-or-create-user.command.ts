import { Command } from '@nestjs/cqrs';
import { CreateUserDto } from '../../dto/create-user.dto';
import { IUserResponse } from '../../interfaces';

export class FindOrCreateUserCommand extends Command<IUserResponse> {
  constructor(public readonly dto: CreateUserDto) {
    super();
  }
}
