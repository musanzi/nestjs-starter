import { Command } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { SignUpDto } from '../../dto/sign-up.dto';

export class SignUpCommand extends Command<UserResponse> {
  constructor(public readonly dto: SignUpDto) {
    super();
  }
}
