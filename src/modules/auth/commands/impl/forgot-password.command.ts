import { Command } from '@nestjs/cqrs';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto';

export class ForgotPassword extends Command<void> {
  constructor(public readonly dto: ForgotPasswordDto) {
    super();
  }
}
