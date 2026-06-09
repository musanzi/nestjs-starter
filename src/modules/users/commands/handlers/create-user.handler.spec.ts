import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { SendGeneratedPasswordEmailCommand } from '@/modules/auth/commands/impl/send-generated-password-email.command';
import { Role } from '@/modules/roles/entities/role.entity';
import { FindRoleByNameQuery } from '@/modules/roles/queries';
import { mockDependency } from '../../../../../test/mock-dependency';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { CreateUserCommand } from '../impl/create-user.command';
import { CreateUserHandler } from './create-user.handler';

describe('CreateUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'create' | 'save'>>;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
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
    commandBus = {
      execute: jest.fn()
    };
    queryBus = {
      execute: jest.fn()
    };
    handler = new CreateUserHandler(
      mockDependency<Repository<User>>(repository),
      mockDependency<CommandBus>(commandBus),
      mockDependency<QueryBus>(queryBus)
    );
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('uses the provided password and does not send a generated password email', async () => {
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
    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(queryBus.execute).toHaveBeenNthCalledWith(1, new FindRoleByNameQuery('user'));
    expect(queryBus.execute).toHaveBeenNthCalledWith(2, new FindUserByIdQuery('user-id'));
  });

  it('generates a six digit password and emails it when password is missing', async () => {
    queryBus.execute.mockResolvedValueOnce(defaultRole).mockResolvedValueOnce(userResponse);
    repository.create.mockImplementationOnce((user) => user as User);
    repository.save.mockResolvedValueOnce(createdUser);
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await handler.execute(new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com' }));

    const createdPayload = repository.create.mock.calls[0][0] as Partial<User>;
    const emailCommand = commandBus.execute.mock.calls[0][0] as SendGeneratedPasswordEmailCommand;

    expect(result).toBe(userResponse);
    expect(createdPayload.password).toMatch(/^\d{6}$/);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(emailCommand).toBeInstanceOf(SendGeneratedPasswordEmailCommand);
    expect(emailCommand.user).toBe(createdUser);
    expect(emailCommand.password).toBe(createdPayload.password);
  });

  it('throws BadRequestException when the generated password email fails', async () => {
    queryBus.execute.mockResolvedValueOnce(defaultRole);
    repository.create.mockImplementationOnce((user) => user as User);
    repository.save.mockResolvedValueOnce(createdUser);
    commandBus.execute.mockRejectedValueOnce(new BadRequestException("Envoi d'email impossible"));

    const promise = handler.execute(new CreateUserCommand({ name: 'Ada Lovelace', email: 'ada@example.com' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow("Création de l'utilisateur impossible");
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });
});
