import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserResponse } from '@/modules/users/interfaces';
import { UpdateUserCommand } from '@/modules/users/commands';
import { logHandlerError } from '@/shared/helpers';
import { ResetPasswordCommand } from '../impl/reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, UserResponse> {
  private readonly logger = new Logger(ResetPasswordHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async execute(command: ResetPasswordCommand): Promise<UserResponse> {
    const { token, password } = command.dto;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.commandBus.execute(new UpdateUserCommand(payload.sub, { password }));
    } catch (error) {
      logHandlerError(this.logger, 'Reset password', error);
      throw new BadRequestException('Mot de passe invalide');
    }
  }
}
