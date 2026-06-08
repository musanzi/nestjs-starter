import { User } from '@/modules/identity/users/entities/user.entity';
import { UpdateUserDto } from '@/modules/identity/users/dto/update-user.dto';

export class UpdateProfileCommand {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdateUserDto
  ) {}
}
