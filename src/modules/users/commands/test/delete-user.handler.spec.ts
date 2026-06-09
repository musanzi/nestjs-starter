import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { User } from '../../entities/user.entity';
import { FindUserByIdQuery } from '../../queries';
import { DeleteUserCommand } from '../impl/delete-user.command';
import { DeleteUserHandler } from '../handlers/delete-user.handler';

describe('DeleteUserHandler', () => {
  let repository: jest.Mocked<Pick<Repository<User>, 'softDelete'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: DeleteUserHandler;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = { softDelete: jest.fn() };
    queryBus = { execute: jest.fn() };
    handler = new DeleteUserHandler(mockDependency<Repository<User>>(repository), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('checks that the user exists before soft deleting it', async () => {
    queryBus.execute.mockResolvedValueOnce({ id: 'user-id' } as User);
    repository.softDelete.mockResolvedValueOnce({ affected: 1, raw: [] });

    await handler.execute(new DeleteUserCommand('user-id'));

    expect(queryBus.execute).toHaveBeenCalledWith(new FindUserByIdQuery('user-id'));
    expect(repository.softDelete).toHaveBeenCalledWith('user-id');
  });

  it('throws NotFoundException unchanged when the user does not exist', async () => {
    queryBus.execute.mockRejectedValueOnce(new NotFoundException('Utilisateur introuvable'));
    const promise = handler.execute(new DeleteUserCommand('user-id'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Utilisateur introuvable');
    expect(repository.softDelete).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when user deletion fails unexpectedly', async () => {
    queryBus.execute.mockResolvedValueOnce({ id: 'user-id' } as User);
    repository.softDelete.mockRejectedValueOnce(new Error('delete failed'));
    const promise = handler.execute(new DeleteUserCommand('user-id'));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Suppression impossible');
  });
});
