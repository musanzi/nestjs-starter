import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { SignInQuery } from '../impl/sign-in.query';

@QueryHandler(SignInQuery)
export class SignInHandler implements IQueryHandler<SignInQuery, UserResponse> {
  async execute(query: SignInQuery): Promise<UserResponse> {
    return query.request['user'] as UserResponse;
  }
}
