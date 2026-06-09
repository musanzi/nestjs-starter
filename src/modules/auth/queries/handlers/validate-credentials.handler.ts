import { UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { compare } from 'bcryptjs';
import { IUserResponse } from '@/modules/users/interfaces';
import { ValidateCredentialsQuery } from '../impl/validate-credentials.query';
import { FindUserQuery } from '@/modules/users/queries';

@QueryHandler(ValidateCredentialsQuery)
export class ValidateCredentialsHandler implements IQueryHandler<ValidateCredentialsQuery, IUserResponse> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: ValidateCredentialsQuery): Promise<IUserResponse> {
    const unauthorized = new UnauthorizedException('Les identifiants saisis sont invalides');

    try {
      const user = await this.queryBus.execute(
        new FindUserQuery(
          { email: query.email },
          {
            select: ['id', 'email', 'password']
          }
        )
      );

      if (!user?.password) throw unauthorized;

      const isPasswordValid = await compare(query.password, user.password);
      if (!isPasswordValid) throw unauthorized;

      return await this.queryBus.execute(new FindUserQuery({ email: query.email }));
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw unauthorized;
    }
  }
}
