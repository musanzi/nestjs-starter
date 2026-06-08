import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { createAuthToken } from '../../common/create-auth-token';
import { logHandlerError } from '@/shared/helpers';
import { ForgotPasswordCommand } from '../impl/forgot-password.command';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand, void> {
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(command.dto.email);
      const token = await createAuthToken(this.jwtService, this.configService, user, '15m');
      const frontendUri = this.configService.get<string>('FRONTEND_URI');
      const link = `${frontendUri}/reset-password?token=${token}`;
      this.eventEmitter.emit('user.reset-password', { user, link });
    } catch (error) {
      logHandlerError(this.logger, 'Forgot password', error, `email="${command.dto.email}"`);
      throw new BadRequestException('Demande invalide');
    }
  }
}
