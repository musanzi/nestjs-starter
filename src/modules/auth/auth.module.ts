import { Global, Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../identity/users/users.module';
import { AuthEmailService } from './services/auth-email.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SessionSerializer } from './session.serializer';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Global()
@Module({
  imports: [CqrsModule, UsersModule, PassportModule, JwtModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    SessionSerializer,
    AuthEmailService,
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [AuthService]
})
export class AuthModule {}
