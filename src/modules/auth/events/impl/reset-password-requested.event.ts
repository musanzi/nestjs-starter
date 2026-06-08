import { IEvent } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';

type ResetPasswordUser = Pick<User, 'name' | 'email'>;

export class ResetPasswordRequestedEvent implements IEvent {
  constructor(
    public readonly user: ResetPasswordUser,
    public readonly link: string
  ) {}
}
