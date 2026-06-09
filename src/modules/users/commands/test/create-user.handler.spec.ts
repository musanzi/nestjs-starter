import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserQuery } from '../../queries';
import { CreateUserCommand } from '../impl/create-user.command';
import { CreateUserHandler } from '../handlers/create-user.handler';
import { WelcomeUserEvent } from '../../events';
import { FindRoleQuery } from '@/modules/roles/queries';

describe('CreateUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOne' | 'create' | 'save'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: CreateUserHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const defaultRole = { id: 'role-id', name: 'user' } as Role;
  const createdUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' } as User;
  const userResponse = { ...createdUser, roles: ['user'] } as UserResponse;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
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

  it('uses the provided password and publishes a welcome event without a default password', async () => {
    const user = { ...createdUser, password: 'provided-password' } as User;
    repository.findOne.mockResolvedValueOnce(null);
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
    expect(eventBus.publish).toHaveBeenCalledWith(new WelcomeUserEvent(createdUser));
    expect(queryBus.execute).toHaveBeenNthCalledWith(
      1,
      new FindRoleQuery({
        where: { name: 'user' }
      })
    );
    expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserQuery({ where: { id: 'user-id' } }));
  });

  it('generates a six digit password and publishes a welcome event when password is missing', async () => {
    repository.findOne.mockResolvedValueOnce(null);
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
    repository.findOne.mockResolvedValueOnce(null);
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
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserQuery({ where: { id: 'user-id' } }));
  });

  it('throws ConflictException when the email already exists', async () => {
    repository.findOne.mockResolvedValueOnce(createdUser);
    const promise = handler.execute(
      new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'provided-password' })
    );

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Cet utilisateur existe déjà');
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user creation fails unexpectedly', async () => {
    repository.findOne.mockResolvedValueOnce(null);
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
