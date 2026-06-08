import { Query } from '@nestjs/cqrs';
import { UserResponse } from '../../interfaces';

export class FindUserByIdQuery extends Query<UserResponse> {
  constructor(public readonly id: string) {
    super();
  }
}
