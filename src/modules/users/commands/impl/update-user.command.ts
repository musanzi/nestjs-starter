import { Command } from '@nestjs/cqrs';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserResponse } from '../../interfaces';

export class UpdateUserCommand extends Command<UserResponse> {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateUserDto
  ) {
    super();
  }
}
