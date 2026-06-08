import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';

export function createAuthToken(
  jwtService: JwtService,
  configService: ConfigService,
  user: User,
  expiresIn: number | string = '1d'
): Promise<string> {
  const secret = configService.get<string>('JWT_SECRET');
  const payload = { sub: user.id, name: user.name, email: user.email };
  const options: Record<string, unknown> = { secret, expiresIn };
  return jwtService.signAsync(payload, options);
}
