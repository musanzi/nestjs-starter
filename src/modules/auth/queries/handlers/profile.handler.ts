import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { User } from '@/modules/users/entities/user.entity';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { ProfileQuery } from '../impl/profile.query';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, User> {
  constructor(private readonly queryBus: QueryBus) {}

  execute(query: ProfileQuery): Promise<User> {
    return this.queryBus.execute(new FindUserByEmailQuery(query.currentUser.email));
  }
}
