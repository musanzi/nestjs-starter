import { Query } from '@nestjs/cqrs';
import { UserResponse } from '../../interfaces';

export class FindUserByEmailQuery extends Query<UserResponse> {
  constructor(public readonly email: string) {
    super();
  }
}
