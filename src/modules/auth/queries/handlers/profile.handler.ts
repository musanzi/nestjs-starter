import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { ProfileQuery } from '../impl';
import { FindUserByEmailQuery } from '@/modules/users/queries';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, IUserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  execute(query: ProfileQuery): Promise<IUserResponse | null> {
    const { currentUser } = query;
    if (!currentUser?.email) return null;
    return this.queryBus.execute(new FindUserByEmailQuery(currentUser.email));
  }
}
