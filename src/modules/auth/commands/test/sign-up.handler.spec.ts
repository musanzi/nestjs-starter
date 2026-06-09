import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@/modules/users/commands';
import { UserResponse } from '@/modules/users/interfaces';
import { FindUserQuery } from '@/modules/users/queries';
import { mockDependency } from '@/shared/helpers';
import { SignUpCommand } from '../impl/sign-up.command';
import { SignUpHandler } from '../handlers/sign-up.handler';

describe('SignUpHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: SignUpHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const dto = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'password', referral_code: 'REF' };
  const savedUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as UserResponse;
  const freshUser = { ...savedUser, avatar: 'avatar.png' } as UserResponse;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    handler = new SignUpHandler(mockDependency<CommandBus>(commandBus), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('creates a user and returns the fresh user', async () => {
    commandBus.execute.mockResolvedValueOnce(savedUser);
    queryBus.execute.mockResolvedValueOnce(freshUser);

    const result = await handler.execute(new SignUpCommand(dto));

    expect(result).toBe(freshUser);
    expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand(dto));
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserQuery({ where: { id: 'user-id' } }));
  });

  it('throws ConflictException unchanged when the email already exists', async () => {
    commandBus.execute.mockRejectedValueOnce(new ConflictException('Cet utilisateur existe déjà'));
    const promise = handler.execute(new SignUpCommand(dto));

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Cet utilisateur existe déjà');
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when sign up handling fails unexpectedly', async () => {
    commandBus.execute.mockRejectedValueOnce(new Error('create failed'));
    const promise = handler.execute(new SignUpCommand(dto));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('create failed');
  });
});
