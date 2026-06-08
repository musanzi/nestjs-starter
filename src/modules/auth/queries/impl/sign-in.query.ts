import { Query } from '@nestjs/cqrs';
import { Request } from 'express';
import { UserResponse } from '@/modules/users/interfaces';

export class SignInQuery extends Query<UserResponse> {
  constructor(public readonly request: Request) {
    super();
  }
}
