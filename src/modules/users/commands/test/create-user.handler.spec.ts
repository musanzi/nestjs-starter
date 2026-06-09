import { BadRequestException, Logger } from '@nestjs/common';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WelcomeUserEvent } from '@/modules/auth/events';
import { Role } from '@/modules/roles/entities/role.entity';
import { FindRoleByNameQuery } from '@/modules/roles/queries';
import { mockDependency } from '../../../../../test/mock-dependency';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { CreateUserCommand } from '../impl/create-user.command';
import { CreateUserHandler } from '../handlers/create-user.handler';

describe('CreateUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: CreateUserHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const defaultRole = { id: 'role-id', name: 'user' } as Role;
  const createdUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' } as User;
  const userResponse = { ...createdUser, roles: ['user'] } as UserResponse;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn()
    };
    eventBus = {
      publish: jest.fn()
    };
    queryBus = {
      execute: jest.fn()
    };
    handler = new CreateUserHandler(
      mockDependency<Repository<User>>(repository),
      mockDependency<EventBus>(eventBus),
      mockDependency<QueryBus>(queryBus)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('uses the provided password and does not publish a welcome event', async () => {
    const user = { ...createdUser, password: 'provided-password' } as User;
    queryBus.execute.mockResolvedValueOnce(defaultRole).mockResolvedValueOnce(userResponse);
    repository.create.mockReturnValueOnce(user);
    repository.save.mockResolvedValueOnce(createdUser);

    const result = await handler.execute(
      new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'provided-password' })
    );

    expect(result).toBe(userResponse);
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'provided-password',
      roles: [defaultRole]
    });
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindRoleByNameQuery('user'));
    expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByIdQuery('user-id'));
  });

  it('generates a six digit password and publishes a welcome event when password is missing', async () => {
    queryBus.execute.mockResolvedValueOnce(defaultRole).mockResolvedValueOnce(userResponse);
    repository.create.mockImplementationOnce((user) => user as User);
    repository.save.mockResolvedValueOnce(createdUser);

    const result = await handler.execute(new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com' }));

    const createdPayload = repository.create.mock.calls[0][0] as Partial<User>;
    const welcomeEvent = eventBus.publish.mock.calls[0][0] as WelcomeUserEvent;

    expect(result).toBe(userResponse);
    expect(createdPayload.password).toMatch(/^\d{6}$/);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(welcomeEvent).toBeInstanceOf(WelcomeUserEvent);
    expect(welcomeEvent.user).toBe(createdUser);
    expect(welcomeEvent.defaultPassword).toBe(createdPayload.password);
  });

  it('uses provided role ids without looking up the default role', async () => {
    const user = { ...createdUser, roles: [{ id: 'admin-role-id' }] } as User;
    queryBus.execute.mockResolvedValueOnce(userResponse);
    repository.create.mockReturnValueOnce(user);
    repository.save.mockResolvedValueOnce(createdUser);

    const result = await handler.execute(
      new CreateUserCommand({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'provided-password',
        roles: ['admin-role-id']
      })
    );

    expect(result).toBe(userResponse);
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'provided-password',
      roles: [{ id: 'admin-role-id' }]
    });
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('user-id'));
  });

  it('throws BadRequestException when user creation fails unexpectedly', async () => {
    queryBus.execute.mockResolvedValueOnce(defaultRole);
    repository.create.mockImplementationOnce((user) => user as User);
    repository.save.mockRejectedValueOnce(new Error('save failed'));
    const promise = handler.execute(
      new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'provided-password' })
    );

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow("Création de l'utilisateur impossible");
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
