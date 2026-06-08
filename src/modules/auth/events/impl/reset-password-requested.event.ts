import { IEvent } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';

export class ResetPasswordRequestedEvent implements IEvent {
  constructor(
    public readonly user: User,
    public readonly link: string
  ) {}
}
