import { Query } from '@nestjs/cqrs';
import { UserResponse } from '../../interfaces';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import { User } from '../../entities/user.entity';

type FindUserQueryOptions = Omit<FindOneOptions<User>, 'where' | 'relations'>;

export class FindUserQuery extends Query<UserResponse> {
  constructor(
    public readonly where: FindOptionsWhere<User>,
    public readonly options: FindUserQueryOptions = {}
  ) {
    super();
  }
}
