import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';

type AuthTokenUser = Pick<User, 'id' | 'name' | 'email'>;

export function createAuthToken(
  jwtService: JwtService,
  configService: ConfigService,
  user: AuthTokenUser,
  expiresIn: number | string = '1d'
): Promise<string> {
  const secret = configService.get<string>('JWT_SECRET');
  const payload = { sub: user.id, name: user.name, email: user.email };
  const options: Record<string, unknown> = { secret, expiresIn };
  return jwtService.signAsync(payload, options);
}
