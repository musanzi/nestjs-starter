import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { ProfileQuery } from '../impl/profile.query';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, UserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  execute(query: ProfileQuery): Promise<UserResponse> {
    return this.queryBus.execute(new FindUserByEmailQuery(query.currentUser.email));
  }
}
