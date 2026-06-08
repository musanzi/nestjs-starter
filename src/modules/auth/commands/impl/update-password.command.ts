import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { UserResponse } from '@/modules/users/interfaces';
import { UpdatePasswordDto } from '../../dto/update-password.dto';

export class UpdatePasswordCommand extends Command<UserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdatePasswordDto
  ) {
    super();
  }
}
