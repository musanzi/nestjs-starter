import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
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

  const existingUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as User;
  const userResponse = { ...existingUser, roles: [] } as UserResponse;
  const createDto = () => ({ name: 'Ada Lovelace', email: 'ada@example.com', avatar: 'google-avatar.png' });

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

  it('sets the Google avatar when an existing user has no avatar', async () => {
    const dto = createDto();
    repository.findOne.mockResolvedValueOnce({ ...existingUser, avatar: null } as User);
    commandBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new FindOrCreateUserCommand(dto));

    expect(result).toBe(userResponse);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'ada@example.com' }, relations: ['roles'] });
    expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserCommand('user-id', dto));
  });

  it('updates an existing user without replacing an avatar that already exists', async () => {
    const dto = createDto();
    const userWithAvatar = { ...existingUser, avatar: 'existing-avatar.png' } as User;
    repository.findOne.mockResolvedValueOnce(userWithAvatar);
    commandBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new FindOrCreateUserCommand(dto));

    expect(result).toBe(userResponse);
    expect(dto).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(commandBus.execute).toHaveBeenCalledWith(
      new UpdateUserCommand('user-id', { name: 'Ada Lovelace', email: 'ada@example.com' })
    );
  });

  it('creates a new user when no existing user matches the email', async () => {
    const dto = createDto();
    repository.findOne.mockResolvedValueOnce(null);
    commandBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new FindOrCreateUserCommand(dto));

    expect(result).toBe(userResponse);
    expect(commandBus.execute).toHaveBeenCalledWith(new CreateUserCommand(dto));
  });

  it('throws BadRequestException when find or create fails unexpectedly', async () => {
    repository.findOne.mockRejectedValueOnce(new Error('database unavailable'));
    const promise = handler.execute(new FindOrCreateUserCommand(createDto()));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Requête invalide');
  });
});
