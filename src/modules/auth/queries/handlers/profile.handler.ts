import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { ProfileQuery } from '../impl/profile.query';
import { FindUserQuery } from '@/modules/users/queries';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, UserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  execute(query: ProfileQuery): Promise<UserResponse> {
    return this.queryBus.execute(
      new FindUserQuery({ email: query.currentUser.email })
    );
  }
}
