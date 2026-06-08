import { BadRequestException, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { User } from '@/modules/identity/users/entities/user.entity';
import { logHandlerError } from '@/shared/helpers';
import { ResetPasswordCommand } from '../impl/reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, User> {
  private readonly logger = new Logger(ResetPasswordHandler.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async execute(command: ResetPasswordCommand): Promise<User> {
    const { token, password } = command.dto;

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return await this.usersService.update(payload.sub, { password });
    } catch (error) {
      logHandlerError(this.logger, 'Reset password', error);
      throw new BadRequestException('Mot de passe invalide');
    }
  }
}
