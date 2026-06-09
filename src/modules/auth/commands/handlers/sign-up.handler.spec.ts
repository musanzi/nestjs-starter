import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@/modules/users/commands';
import { UserResponse } from '@/modules/users/interfaces';
import { FindUserByEmailQuery, FindUserByIdQuery } from '@/modules/users/queries';
import { mockDependency } from '../../../../../test/mock-dependency';
import { WelcomeUserEvent } from '../../events';
import { SignUpCommand } from '../impl/sign-up.command';
import { SignUpHandler } from './sign-up.handler';

describe('SignUpHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
  let handler: SignUpHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const dto = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'password', referral_code: 'REF' };
  const savedUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as UserResponse;
  const freshUser = { ...savedUser, avatar: 'avatar.png' } as UserResponse;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    eventBus = { publish: jest.fn() };
    handler = new SignUpHandler(
      mockDependency<CommandBus>(commandBus),
      mockDependency<QueryBus>(queryBus),
      mockDependency<EventBus>(eventBus)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('creates a user, publishes a welcome event, and returns the fresh user', async () => {
    queryBus.execute.mockResolvedValueOnce(undefined).mockResolvedValueOnce(freshUser);
    commandBus.execute.mockResolvedValueOnce(savedUser);

    const result = await handler.execute(new SignUpCommand(dto));

    expect(result).toBe(freshUser);
    expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindUserByEmailQuery('ada@example.com'));
    expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand(dto));
    expect(eventBus.publish).toHaveBeenCalledWith(new WelcomeUserEvent(savedUser));
    expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByIdQuery('user-id'));
  });

  it('throws ConflictException unchanged when the email already exists', async () => {
    queryBus.execute.mockResolvedValueOnce(savedUser);
    const promise = handler.execute(new SignUpCommand(dto));

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Cet utilisateur existe déjà');
    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when sign up handling fails unexpectedly', async () => {
    queryBus.execute.mockResolvedValueOnce(undefined);
    commandBus.execute.mockRejectedValueOnce(new Error('create failed'));
    const promise = handler.execute(new SignUpCommand(dto));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('create failed');
  });
});
