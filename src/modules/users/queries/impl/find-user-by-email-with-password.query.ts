import { Query } from '@nestjs/cqrs';
import { User } from '../../entities/user.entity';

export class FindUserByEmailWithPasswordQuery extends Query<User> {
  constructor(public readonly email: string) {
    super();
  }
}
