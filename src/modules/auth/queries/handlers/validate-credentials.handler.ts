import { UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { compare } from 'bcryptjs';
import { UserResponse } from '@/modules/users/interfaces';
import { FindUserByEmailQuery, FindUserByEmailWithPasswordQuery } from '@/modules/users/queries';
import { ValidateCredentialsQuery } from '../impl/validate-credentials.query';

@QueryHandler(ValidateCredentialsQuery)
export class ValidateCredentialsHandler implements IQueryHandler<ValidateCredentialsQuery, UserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: ValidateCredentialsQuery): Promise<UserResponse> {
    const unauthorized = new UnauthorizedException('Les identifiants saisis sont invalides');

    try {
      const user = await this.queryBus.execute(new FindUserByEmailWithPasswordQuery(query.email));
      if (!user?.password) throw unauthorized;

      const isPasswordValid = await compare(query.password, user.password);
      if (!isPasswordValid) throw unauthorized;

      return await this.queryBus.execute(new FindUserByEmailQuery(user.email));
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw unauthorized;
    }
  }
}
