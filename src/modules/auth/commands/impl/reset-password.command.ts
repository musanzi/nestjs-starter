import { Command } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { ResetPasswordDto } from '../../dto/reset-password.dto';

export class ResetPasswordCommand extends Command<UserResponse> {
  constructor(public readonly dto: ResetPasswordDto) {
    super();
  }
}
