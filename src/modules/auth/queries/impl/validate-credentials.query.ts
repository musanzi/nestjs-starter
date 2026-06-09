import { Query } from '@nestjs/cqrs';
import { IUserResponse } from '@/modules/users/interfaces';

export class ValidateCredentialsQuery extends Query<IUserResponse> {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {
    super();
  }
}
