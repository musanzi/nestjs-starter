import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { IGoogleProfile } from '../interfaces/google-profile.interface';
import { CommandBus } from '@nestjs/cqrs';
import { FindOrCreateUserCommand } from '@/modules/users/commands';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly commandBus: CommandBus
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_SECRET'),
      callbackURL: configService.get('GOOGLE_REDIRECT_URI'),
      scope: ['profile', 'email']
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: IGoogleProfile) {
    const { emails, name, photos } = profile;
    const userDto: CreateUserDto = {
      email: emails[0]['value'],
      name: `${name['givenName']} ${name['familyName']}`,
      avatar: photos[0]['value']
    };
    return await this.commandBus.execute(new FindOrCreateUserCommand(userDto));
  }
}
