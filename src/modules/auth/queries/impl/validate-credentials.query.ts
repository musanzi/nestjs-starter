import { Query } from '@nestjs/cqrs';
import { UserResponse } from '@/modules/users/interfaces';

export class ValidateCredentialsQuery extends Query<UserResponse> {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {
    super();
  }
}
