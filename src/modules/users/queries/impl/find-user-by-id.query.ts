import { Query } from '@nestjs/cqrs';
import { IUserResponse } from '../../interfaces';

export class FindUserByIdQuery extends Query<IUserResponse> {
  constructor(public readonly id: string) {
    super();
  }
}
