import { Command } from '@nestjs/cqrs';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UserResponse } from '../../interfaces';

export class FindOrCreateUserCommand extends Command<UserResponse> {
  constructor(public readonly dto: CreateUserDto) {
    super();
  }
}
