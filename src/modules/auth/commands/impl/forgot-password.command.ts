import { ForgotPasswordDto } from '../../dto/forgot-password.dto';

export class ForgotPasswordCommand {
  constructor(public readonly dto: ForgotPasswordDto) {}
}
