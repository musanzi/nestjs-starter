import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { ProfileQuery } from '../impl';
import { FindUserByEmailQuery } from '@/modules/users/queries';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, IUserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: ProfileQuery): Promise<IUserResponse> {
    const { currentUser } = query;
    return await this.queryBus.execute(new FindUserByEmailQuery(currentUser.email));
  }
}
