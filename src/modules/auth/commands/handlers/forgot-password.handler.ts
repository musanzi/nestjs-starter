import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { createAuthToken } from '../../common/create-auth-token';
import { logHandlerError } from '@/shared/helpers';
import { ForgotPasswordCommand } from '../impl/forgot-password.command';
import { ResetPasswordRequestedEvent } from '../../events';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand, void> {
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<void> {
    const { dto } = command;

    try {
      const user = await this.queryBus.execute(new FindUserByEmailQuery(dto.email));

      const token = await createAuthToken(this.jwtService, this.configService, user, '15m');

      const frontendUri = this.configService.get<string>('FRONTEND_URI');
      const link = `${frontendUri}/reset-password?token=${token}`;

      this.eventBus.publish(new ResetPasswordRequestedEvent(user, link));
    } catch (error) {
      logHandlerError(this.logger, 'Forgot password', error, `email="${dto.email}"`);
      throw new BadRequestException('Demande invalide');
    }
  }
}
