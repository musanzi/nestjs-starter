import { UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { compare } from 'bcryptjs';
import { User } from '@/modules/users/entities/user.entity';
import { UserResponse } from '@/modules/users/interfaces';
import { FindUserQuery } from '@/modules/users/queries';
import { mockDependency } from '@/shared/helpers';
import { ValidateCredentialsQuery } from '../impl/validate-credentials.query';
import { ValidateCredentialsHandler } from '../handlers/validate-credentials.handler';

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

describe('ValidateCredentialsHandler', () => {
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: ValidateCredentialsHandler;
  const compareMock = compare as jest.MockedFunction<(data: string, encrypted: string) => Promise<boolean>>;

  const privateUser = {
    id: 'user-id',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'hashed-password'
  } as User;
  const publicUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as UserResponse;

  beforeEach(() => {
    queryBus = { execute: jest.fn() };
    handler = new ValidateCredentialsHandler(mockDependency<QueryBus>(queryBus));
    compareMock.mockReset();
  });

  it('returns the public user when credentials are valid', async () => {
    queryBus.execute.mockResolvedValueOnce(privateUser).mockResolvedValueOnce(publicUser);
    compareMock.mockResolvedValueOnce(true);

    const result = await handler.execute(new ValidateCredentialsQuery('ada@example.com', 'password'));

    expect(result).toBe(publicUser);
    expect(queryBus.execute).toHaveBeenNthCalledWith(
      1,
      new FindUserQuery({
        where: { email: 'ada@example.com' },
        select: ['id', 'email', 'password']
      })
    );
    expect(compareMock).toHaveBeenCalledWith('password', 'hashed-password');
    expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserQuery({ where: { email: 'ada@example.com' } }));
  });

  it('throws UnauthorizedException when the user is missing', async () => {
    queryBus.execute.mockResolvedValueOnce(undefined);

    await expect(handler.execute(new ValidateCredentialsQuery('ada@example.com', 'password'))).rejects.toThrow(
      UnauthorizedException
    );
    expect(compareMock).not.toHaveBeenCalled();
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedException when the user has no password hash', async () => {
    queryBus.execute.mockResolvedValueOnce({ ...privateUser, password: null });

    await expect(handler.execute(new ValidateCredentialsQuery('ada@example.com', 'password'))).rejects.toThrow(
      UnauthorizedException
    );
    expect(compareMock).not.toHaveBeenCalled();
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedException when the password is invalid', async () => {
    queryBus.execute.mockResolvedValueOnce(privateUser);
    compareMock.mockResolvedValueOnce(false);

    await expect(handler.execute(new ValidateCredentialsQuery('ada@example.com', 'password'))).rejects.toThrow(
      UnauthorizedException
    );
    expect(compareMock).toHaveBeenCalledWith('password', 'hashed-password');
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedException when credential lookup fails unexpectedly', async () => {
    queryBus.execute.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(handler.execute(new ValidateCredentialsQuery('ada@example.com', 'password'))).rejects.toThrow(
      UnauthorizedException
    );
    expect(compareMock).not.toHaveBeenCalled();
  });
});
