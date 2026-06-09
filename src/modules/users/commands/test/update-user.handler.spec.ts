import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { UserResponse } from '../../interfaces';
import { FindUserByIdQuery } from '../../queries';
import { UpdateUserCommand } from '../impl/update-user.command';
import { UpdateUserHandler } from '../handlers/update-user.handler';

describe('UpdateUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'findOne' | 'merge' | 'save'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: UpdateUserHandler;
  let loggerErrorSpy: jest.SpyInstance;

  const user = { id: 'user-id', name: 'Ada Lovelace', email: 'ada@example.com' } as User;
  const updatedUser = { id: 'user-id', name: 'Ada Byron', email: 'ada@example.com' } as User;
  const userResponse = { ...updatedUser, roles: ['admin'] } as UserResponse;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      merge: jest.fn(),
      save: jest.fn()
    };
    queryBus = { execute: jest.fn() };
    handler = new UpdateUserHandler(mockDependency<Repository<User>>(repository), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('updates a user and maps provided role ids', async () => {
    repository.findOne.mockResolvedValueOnce(user);
    repository.merge.mockReturnValueOnce(updatedUser);
    repository.save.mockResolvedValueOnce(updatedUser);
    queryBus.execute.mockResolvedValueOnce(userResponse);

    const result = await handler.execute(new UpdateUserCommand('user-id', { name: 'Ada Byron', roles: ['role-id'] }));

    expect(result).toBe(userResponse);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.merge).toHaveBeenCalledWith(user, { name: 'Ada Byron', roles: [{ id: 'role-id' }] });
    expect(repository.save).toHaveBeenCalledWith(updatedUser);
    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('user-id'));
  });

  it('checks email uniqueness when the email changes', async () => {
    repository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);
    repository.merge.mockReturnValueOnce({ ...updatedUser, email: 'ada.byron@example.com' } as User);
    repository.save.mockResolvedValueOnce({ ...updatedUser, email: 'ada.byron@example.com' } as User);
    queryBus.execute.mockResolvedValueOnce({ ...userResponse, email: 'ada.byron@example.com' });

    await handler.execute(new UpdateUserCommand('user-id', { email: 'ada.byron@example.com' }));

    expect(repository.findOne).toHaveBeenNthCalledWith(2, { where: { email: 'ada.byron@example.com' } });
  });

  it('throws NotFoundException unchanged when the user does not exist', async () => {
    repository.findOne.mockResolvedValueOnce(null);
    const promise = handler.execute(new UpdateUserCommand('user-id', { name: 'Ada Byron' }));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Aucun utilisateur trouvé');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws ConflictException unchanged when the new email is already used', async () => {
    repository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce({ id: 'other-user-id' } as User);
    const promise = handler.execute(new UpdateUserCommand('user-id', { email: 'ada.byron@example.com' }));

    await expect(promise).rejects.toThrow(ConflictException);
    await expect(promise).rejects.toThrow('Un utilisateur avec cette adresse email existe déjà');
    expect(repository.merge).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user update fails unexpectedly', async () => {
    repository.findOne.mockResolvedValueOnce(user);
    repository.merge.mockReturnValueOnce(updatedUser);
    repository.save.mockRejectedValueOnce(new Error('save failed'));
    const promise = handler.execute(new UpdateUserCommand('user-id', { name: 'Ada Byron' }));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Mise à jour impossible');
  });
});
