import { User } from '@/modules/identity/users/entities/user.entity';
import { UpdatePasswordDto } from '../../dto/update-password.dto';

export class UpdatePasswordCommand {
  constructor(
    public readonly currentUser: User,
    public readonly dto: UpdatePasswordDto
  ) {}
}
