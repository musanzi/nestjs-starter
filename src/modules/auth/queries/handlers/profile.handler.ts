import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { ProfileQuery } from '../impl/profile.query';
import { FindUserQuery } from '@/modules/users/queries';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, IUserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  execute(query: ProfileQuery): Promise<IUserResponse> {
    return this.queryBus.execute(new FindUserQuery({ email: query.currentUser.email }));
  }
}
