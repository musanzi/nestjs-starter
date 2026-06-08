import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { SignInQuery } from '../impl/sign-in.query';

@QueryHandler(SignInQuery)
export class SignInHandler implements IQueryHandler<SignInQuery, User> {
  async execute(query: SignInQuery): Promise<User> {
    return query.request['user'] as User;
  }
}
