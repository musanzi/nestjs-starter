import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { mockDependency } from '@/shared/helpers';
import { FindRoleQuery } from '../../queries';
import { Role } from '../../entities/role.entity';
import { DeleteRoleCommand } from '../impl/delete-role.command';
import { DeleteRoleHandler } from '../handlers/delete-role.handler';

describe('DeleteRoleHandler', () => {
  let repository: jest.Mocked<Pick<Repository<Role>, 'delete'>>;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let handler: DeleteRoleHandler;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = { delete: jest.fn() };
    queryBus = { execute: jest.fn() };
    handler = new DeleteRoleHandler(mockDependency<Repository<Role>>(repository), mockDependency<QueryBus>(queryBus));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('checks that the role exists before deleting it', async () => {
    queryBus.execute.mockResolvedValueOnce({ id: 'role-id', name: 'admin' });
    repository.delete.mockResolvedValueOnce({ affected: 1, raw: [] });

    await handler.execute(new DeleteRoleCommand('role-id'));

    expect(queryBus.execute).toHaveBeenCalledWith(new FindRoleQuery({ id: 'role-id' }));
    expect(repository.delete).toHaveBeenCalledWith('role-id');
  });

  it('throws NotFoundException unchanged when the role does not exist', async () => {
    queryBus.execute.mockRejectedValueOnce(new NotFoundException('Rôle introuvable'));
    const promise = handler.execute(new DeleteRoleCommand('role-id'));

    await expect(promise).rejects.toThrow(NotFoundException);
    await expect(promise).rejects.toThrow('Rôle introuvable');
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when role deletion fails unexpectedly', async () => {
    queryBus.execute.mockResolvedValueOnce({ id: 'role-id', name: 'admin' });
    repository.delete.mockRejectedValueOnce(new Error('delete failed'));
    const promise = handler.execute(new DeleteRoleCommand('role-id'));

    await expect(promise).rejects.toThrow(BadRequestException);
    await expect(promise).rejects.toThrow('Suppression du rôle impossible');
  });
});
