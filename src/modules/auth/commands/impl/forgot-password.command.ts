import { Command } from '@nestjs/cqrs';
import { ForgotPasswordDto } from '../../dto/forgot-password.dto';

export class ForgotPasswordCommand extends Command<void> {
  constructor(public readonly dto: ForgotPasswordDto) {
    super();
  }
}
