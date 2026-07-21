import { Command } from '@nestjs/cqrs';

export class ForgotPassword extends Command<void> {
  constructor(public readonly email: string) {
    super();
  }
}
