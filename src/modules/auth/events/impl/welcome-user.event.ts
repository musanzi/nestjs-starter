import { IEvent } from '@nestjs/cqrs';
import { User } from '@/modules/identity/users/entities/user.entity';

export class WelcomeUserEvent implements IEvent {
  constructor(public readonly user: User) {}
}
