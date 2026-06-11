import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { SignInQuery } from '../impl';

@QueryHandler(SignInQuery)
export class SignInHandler implements IQueryHandler<SignInQuery, IUserResponse> {
  async execute(query: SignInQuery): Promise<IUserResponse> {
    return query.request['user'] as IUserResponse;
  }
}
