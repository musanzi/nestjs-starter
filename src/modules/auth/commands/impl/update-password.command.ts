import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';
import { UpdatePasswordDto } from '../../dto/update-password.dto';

export class UpdatePasswordCommand extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdatePasswordDto
  ) {
    super();
  }
}
