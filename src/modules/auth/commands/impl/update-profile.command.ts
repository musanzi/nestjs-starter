import { User } from '@/modules/users/entities/user.entity';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';

export class UpdateProfileCommand {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdateUserDto
  ) {}
}
