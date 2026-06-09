import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '../../../../../test/mock-dependency';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { CreateUserCommand } from '../impl/create-user.command';
import { FindOrCreateUserCommand } from '../impl/find-or-create-user.command';
import { UpdateUserCommand } from '../impl/update-user.command';
import { FindOrCreateUserHandler } from '../handlers/find-or-create-user.handler';

describe('FindOrCreateUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let handler: FindOrCreateUserHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const dto = { name: 'Ada Lovelace', email: 'ada@example.com' };
  const existingUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' } as User;
  const userResponse = { ...existingUser, roles: [] } as UserResponse;

  beforeEach(() => {
    repository = { findOne: jest.fn() };
    commandBus = { execute: jest.fn() };
    handler = new FindOrCreateUserHandler(
      mockDependency<Repository<User>>(repository),
      mockDependency<CommandBus>(commandBus)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('updates an existing user found by email', async () => {
    repository.findOne.mockResolvedValueOnce(existingUser);
    commandBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new FindOrCreateUserCommand(dto));

    expect(result).toBe(userResponse);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'ada@example.com' } });
    expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserCommand('user-id', dto));
  });

  it('creates a new user when no existing user matches the email', async () => {
    repository.findOne.mockResolvedValueOnce(null);
    commandBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new FindOrCreateUserCommand(dto));

    expect(result).toBe(userResponse);
    expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand(dto));
  });

  it('throws BadRequestException when find or create fails unexpectedly', async () => {
    repository.findOne.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindOrCreateUserCommand(dto));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Requête invalide');
  });
});
