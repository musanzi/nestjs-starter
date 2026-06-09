import { BadRequestException, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateUserCommand } from '@/modules/users/commands';
import { User } from '@/modules/users/entities/user.entity';
import { UserResponse } from '@/modules/users/interfaces';
import { mockDependency } from '@/shared/helpers';
import { UpdateProfileCommand } from '../impl/update-profile.command';
import { UpdateProfileHandler } from '../handlers/update-profile.handler';

describe('UpdateProfileHandler', () => {
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let handler: UpdateProfileHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const currentUser = { id: 'user-id', email: 'ada@example.com' } as User;
  const dto = { name: 'Ada Lovelace' };
  const updatedUser = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com', roles: [] } as UserResponse;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    handler = new UpdateProfileHandler(mockDependency<CommandBus>(commandBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('updates the current user profile', async () => {
    commandBus.execute.mockResolvedValueOnce(updatedUser);

    const result = await handler.execute(new UpdateProfileCommand(currentUser, dto));

    expect(result).toBe(updatedUser);
    expect(commandBus.execute).toHaveBeenCalledWith(new UpdateUserCommand('user-id', dto));
  });

  it('throws BadRequestException when update profile handling fails', async () => {
    commandBus.execute.mockRejectedValueOnce(new Error('update failed'));
    const promise = handler.execute(new UpdateProfileCommand(currentUser, dto));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Requête invalide');
  });
});
