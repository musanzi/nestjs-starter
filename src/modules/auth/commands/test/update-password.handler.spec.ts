import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateUserCommand } from '@/modules/users/commands';
import { User } from '@/modules/users/entities/user.entity';
import { IUserResponse } from '@/modules/users/interfaces';
import { FindUserByEmailQuery } from '@/modules/users/queries';
import { mockDependency } from '@/shared/helpers';
import { UpdatePasswordCommand } from '../impl';
import { UpdatePasswordHandler } from '../handlers/update-password.handler';

describe('UpdatePasswordHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: UpdatePasswordHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const currentUser = { id: 'user-id', email: 'ada@example.com' } as User;
  const updatedUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as IUserResponse;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    handler = new UpdatePasswordHandler(mockDependency<CommandBus>(commandBus), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('updates the current user password and returns the refreshed user', async () => {
    commandBus.execute.mockResolvedValueOnce(updatedUser);
    queryBus.execute.mockResolvedValueOnce(updatedUser);

    const result = await handler.execute(new UpdatePasswordCommand(currentUser, { password: 'new-password' }));

    expect(result).toBe(updatedUser);
    expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserCommand('user-id', { password: 'new-password' }));
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByEmailQuery('ada@example.com'));
  });

  it('throws BadRequestException when update password handling fails', async () => {
    commandBus.execute.mockRejectedValueOnce(new Error('update failed'));
    const promise = handler.execute(new UpdatePasswordCommand(currentUser, { password: 'new-password' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Mise à jour impossible');
  });
});
