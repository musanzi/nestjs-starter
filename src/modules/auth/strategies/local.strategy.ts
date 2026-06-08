import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ValidateCredentialsQuery } from '../queries';
import { UserResponse } from '@/modules/users/interfaces';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly queryBus: QueryBus) {
    super({
      usernameField: 'email'
    });
  }

  async validate(email: string, password: string): Promise<UserResponse> {
    return this.queryBus.execute(new ValidateCredentialsQuery(email, password));
  }
}
