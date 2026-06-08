import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateCredentialsQuery } from '../queries';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly queryBus: QueryBus) {
    super({
      usernameField: 'email'
    });
  }

  async validate(email: string, password: string) {
    return this.queryBus.execute(new ValidateCredentialsQuery(email, password));
  }
}
