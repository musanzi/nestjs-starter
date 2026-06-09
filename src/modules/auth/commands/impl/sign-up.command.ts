import { Command } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { SignUpDto } from '../../dto/sign-up.dto';

export class SignUpCommand extends Command<IUserResponse> {
  constructor(public readonly dto: SignUpDto) {
    super();
  }
}
