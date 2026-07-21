import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';
import { Profile } from '../impl';
import { FindUserByEmail } from '@/modules/users/queries';

@QueryHandler(Profile)
export class ProfileHandler implements IQueryHandler<Profile, IUserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: Profile): Promise<IUserResponse> {
    const { currentUser } = query;
    return await this.queryBus.execute(new FindUserByEmail(currentUser.email));
  }
}
