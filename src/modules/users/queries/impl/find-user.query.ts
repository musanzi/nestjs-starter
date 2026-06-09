import { Query } from '@nestjs/cqrs';
import { UserResponse } from '../../interfaces';
import { FindOneOptions } from 'typeorm';
import { User } from '../../entities/user.entity';

export class FindUserQuery extends Query<UserResponse> {
  constructor(public readonly options: FindOneOptions<User>) {
    super();
  }
}
