import { Command } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';

type GeneratedPasswordUser = Pick<User, 'name' | 'email'>;

export class SendGeneratedPasswordEmailCommand extends Command<void> {
  constructor(
    public readonly user: GeneratedPasswordUser,
    public readonly password: string
  ) {
    super();
  }
}
