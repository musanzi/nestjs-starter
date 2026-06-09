import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { IUserResponse } from '@/modules/users/interfaces';

export class UpdateProfileCommand extends Command<IUserResponse> {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdateUserDto
  ) {
    super();
  }
}
