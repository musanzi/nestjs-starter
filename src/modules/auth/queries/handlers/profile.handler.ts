import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersService } from '@/modules/identity/users/services/users.service';
import { User } from '@/modules/identity/users/entities/user.entity';
import { ProfileQuery } from '../impl/profile.query';

@QueryHandler(ProfileQuery)
export class ProfileHandler implements IQueryHandler<ProfileQuery, User> {
  constructor(private readonly usersService: UsersService) {}

  execute(query: ProfileQuery): Promise<User> {
    return this.usersService.findByEmail(query.currentUser.email);
  }
}
